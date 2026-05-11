from typing import List, Dict, Tuple, Set, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, or_
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import random

# Try to import ML libraries, handle gracefully if not available
try:
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    from sklearn.feature_extraction.text import TfidfVectorizer
    from scipy.sparse.linalg import svds
    from scipy.sparse import csr_matrix
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("Warning: ML libraries not available. Recommendation engine will use basic methods only.")

from models import User, Product, UserInteraction, Purchase, Category, UserProfile
from schemas import ProductWithRecommendationReason


class RecommendationEngine:
    """
    Advanced hybrid recommendation engine with:
    1. Cold start (content-based using onboarding preferences)
    2. Behavioral (user interaction history with time decay)
    3. Collaborative filtering (matrix factorization)
    4. Session-based recommendations
    5. Diversity enforcement
    6. Exploration/exploitation balance
    7. CTR-based optimization
    """
    
    def __init__(self, db: Session):
        self.db = db
        
        # Interaction type weights
        self.interaction_weights = {
            "view": 1.0,
            "click": 2.0,
            "add_to_cart": 3.5,
            "purchase": 5.0,
            "wishlist": 2.5
        }
        
        # Time decay parameters
        self.decay_half_life_days = 14  # Interactions decay by 50% every 14 days
        
        # Caching for TF-IDF vectorizer
        self._tfidf_vectorizer = None
        self._product_vectors = None
        self._product_ids_cache = None
        self._last_vectorizer_update = None
        
        # Diversity parameters
        self.min_category_diversity = 3
        self.serendipity_ratio = 0.15  # 15% unexpected items
        
        # Collaborative filtering cache
        self._user_item_matrix = None
        self._matrix_last_update = None
        self._svd_components = None
    
    def get_recommendations(
        self,
        user: User,
        limit: int = 10,
        exclude_viewed: bool = True,
        category_id: Optional[int] = None,
        session_context: Optional[List[int]] = None
    ) -> Tuple[List[ProductWithRecommendationReason], str, str]:
        """
        Main entry point for recommendations with session context
        Returns: (recommendations, strategy_used, personalization_level)
        
        Args:
            user: User object
            limit: Number of recommendations
            exclude_viewed: Whether to exclude already viewed products
            category_id: Optional category filter
            session_context: List of product IDs viewed in current session
        """
        
        # Determine user's interaction level
        interaction_count = self.db.query(func.count(UserInteraction.id))\
            .filter(UserInteraction.user_id == user.id).scalar()
        
        purchase_count = self.db.query(func.count(Purchase.id))\
            .filter(Purchase.user_id == user.id).scalar()
        
        # Get products to exclude (already viewed/purchased)
        excluded_ids = set()
        if exclude_viewed:
            excluded_ids = self._get_user_viewed_products(user.id)
        
        # Add session-based boost if context is provided
        session_boost_products = []
        if session_context and len(session_context) > 0:
            session_boost_products = self._get_session_based_recommendations(
                session_context[-1],  # Last viewed product
                user,
                excluded_ids,
                limit=5
            )
        
        # Decide strategy based on user maturity
        if interaction_count < 3:
            # Cold start: new user
            recommendations = self._cold_start_recommendations(user, excluded_ids, limit * 2, category_id)
            strategy = "cold_start_content_based"
            personalization_level = "cold_start"
        
        elif interaction_count < 20:
            # Warming up: some history, combine content + behavior
            recommendations = self._hybrid_recommendations(
                user, excluded_ids, limit * 2, category_id,
                behavior_weight=0.6, 
                content_weight=0.3,
                collaborative_weight=0.1
            )
            strategy = "hybrid_behavior_content"
            personalization_level = "warming_up"
        
        else:
            # Fully personalized: rich history
            recommendations = self._hybrid_recommendations(
                user, excluded_ids, limit * 2, category_id,
                behavior_weight=0.5, 
                content_weight=0.2, 
                collaborative_weight=0.2,
                session_weight=0.1
            )
            strategy = "fully_personalized_hybrid"
            personalization_level = "personalized"
        
        # Boost session-based recommendations if available
        if session_boost_products:
            # Insert session recommendations at positions 2-4
            for i, (product, score, reason) in enumerate(session_boost_products[:3]):
                product_dict = self._product_to_dict(product)
                product_dict["recommendation_reason"] = reason
                product_dict["relevance_score"] = score + 0.2  # Boost score
                boosted_rec = ProductWithRecommendationReason(**product_dict)
                
                if len(recommendations) > i + 2:
                    recommendations.insert(i + 2, boosted_rec)
        
        # Ensure diversity across categories
        recommendations = self._ensure_diversity(recommendations, self.min_category_diversity)
        
        # Inject serendipity (exploration)
        recommendations = self._inject_serendipity(
            recommendations, 
            user, 
            excluded_ids,
            self.serendipity_ratio
        )
        
        # Final limit
        recommendations = recommendations[:limit]
        
        return recommendations, strategy, personalization_level
    
    def _apply_time_decay(self, interaction_score: float, timestamp: datetime) -> float:
        """
        Apply exponential time decay to interaction scores
        Score decays by 50% every decay_half_life_days
        """
        days_old = (datetime.utcnow() - timestamp).days
        decay_factor = 0.5 ** (days_old / self.decay_half_life_days)
        return interaction_score * decay_factor
    
    def _cold_start_recommendations(
        self,
        user: User,
        excluded_ids: Set[int],
        limit: int,
        category_id: Optional[int] = None
    ) -> List[ProductWithRecommendationReason]:
        """
        Enhanced content-based recommendations for new users
        """
        recommendations = []
        
        # Strategy 1: Preferred categories with quality filter
        if user.preferred_categories:
            category_products = self._get_products_by_categories(
                user.preferred_categories,
                excluded_ids,
                limit=limit // 2,
                min_rating=4.0  # Quality filter
            )
            
            for product, score in category_products:
                product_dict = self._product_to_dict(product)
                product_dict["recommendation_reason"] = f"Matches your interest in {product.category.name}"
                product_dict["relevance_score"] = score
                recommendations.append(ProductWithRecommendationReason(**product_dict))
        
        # Strategy 2: Interest tags matching with TF-IDF similarity
        if user.interests:
            tag_products = self._get_products_by_tags(
                user.interests,
                excluded_ids,
                limit=limit // 2
            )
            
            for product, score in tag_products:
                product_dict = self._product_to_dict(product)
                matching_tags = set(user.interests) & set(product.tags)
                if matching_tags:
                    product_dict["recommendation_reason"] = f"Matches: {', '.join(list(matching_tags)[:2])}"
                else:
                    product_dict["recommendation_reason"] = "Recommended for you"
                product_dict["relevance_score"] = score
                recommendations.append(ProductWithRecommendationReason(**product_dict))
        
        # Strategy 3: Budget-aware popular items
        if user.budget_range:
            budget_products = self._get_budget_aware_popular(
                user.budget_range,
                excluded_ids,
                limit=limit // 3
            )
            
            for product, score in budget_products:
                product_dict = self._product_to_dict(product)
                product_dict["recommendation_reason"] = "Popular in your price range"
                product_dict["relevance_score"] = score
                recommendations.append(ProductWithRecommendationReason(**product_dict))
        
        # Fill remaining with trending high-quality items
        if len(recommendations) < limit:
            trending = self._get_trending_products(
                excluded_ids, 
                limit - len(recommendations),
                min_rating=4.0
            )
            for product, score in trending:
                product_dict = self._product_to_dict(product)
                product_dict["recommendation_reason"] = "Trending now"
                product_dict["relevance_score"] = score
                recommendations.append(ProductWithRecommendationReason(**product_dict))
        
        # Remove duplicates and limit
        return self._deduplicate_recommendations(recommendations, limit)
    
    def _hybrid_recommendations(
        self,
        user: User,
        excluded_ids: Set[int],
        limit: int,
        category_id: Optional[int] = None,
        behavior_weight: float = 0.5,
        content_weight: float = 0.2,
        collaborative_weight: float = 0.2,
        session_weight: float = 0.1
    ) -> List[ProductWithRecommendationReason]:
        """
        Advanced hybrid recommendation combining multiple strategies with time decay
        """
        
        # Get candidates from each strategy
        behavior_recs = self._behavior_based_recommendations(user, excluded_ids, limit * 3)
        content_recs = self._content_based_recommendations(user, excluded_ids, limit * 2)
        
        # Collaborative filtering with matrix factorization
        collaborative_recs = []
        if collaborative_weight > 0:
            collaborative_recs = self._collaborative_filtering_advanced(user, excluded_ids, limit * 2)
        
        # Combine scores using weighted averaging
        product_scores = defaultdict(lambda: {
            "score": 0.0, 
            "reasons": [], 
            "product": None,
            "sources": []
        })
        
        # Add behavior-based scores (with time decay already applied)
        for product, score, reason in behavior_recs:
            product_scores[product.id]["score"] += score * behavior_weight
            product_scores[product.id]["reasons"].append(reason)
            product_scores[product.id]["product"] = product
            product_scores[product.id]["sources"].append("behavior")
        
        # Add content-based scores
        for product, score, reason in content_recs:
            product_scores[product.id]["score"] += score * content_weight
            product_scores[product.id]["reasons"].append(reason)
            product_scores[product.id]["product"] = product
            product_scores[product.id]["sources"].append("content")
        
        # Add collaborative scores
        for product, score, reason in collaborative_recs:
            product_scores[product.id]["score"] += score * collaborative_weight
            product_scores[product.id]["reasons"].append(reason)
            product_scores[product.id]["product"] = product
            product_scores[product.id]["sources"].append("collaborative")
        
        # Sort by combined score
        sorted_products = sorted(
            product_scores.items(),
            key=lambda x: x[1]["score"],
            reverse=True
        )
        
        # Build final recommendations
        recommendations = []
        for product_id, data in sorted_products[:limit]:
            if data["product"] is None:
                continue
            
            product_dict = self._product_to_dict(data["product"])
            
            # Use the most relevant reason
            if data["reasons"]:
                product_dict["recommendation_reason"] = data["reasons"][0]
            else:
                product_dict["recommendation_reason"] = "Recommended for you"
            
            product_dict["relevance_score"] = min(data["score"], 1.0)
            
            recommendations.append(ProductWithRecommendationReason(**product_dict))
        
        return recommendations
    
    def _behavior_based_recommendations(
        self,
        user: User,
        excluded_ids: Set[int],
        limit: int
    ) -> List[Tuple[Product, float, str]]:
        """
        Recommendations based on user's interaction history WITH TIME DECAY
        """
        # Get user's interaction history
        interactions = self.db.query(UserInteraction)\
            .filter(UserInteraction.user_id == user.id)\
            .order_by(desc(UserInteraction.timestamp))\
            .all()
        
        if not interactions:
            return []
        
        # Calculate product affinity scores with time decay
        product_affinity = defaultdict(lambda: {"score": 0.0, "interactions": []})
        
        for interaction in interactions:
            base_score = self.interaction_weights.get(interaction.interaction_type, 1.0)
            
            # Apply time decay
            decayed_score = self._apply_time_decay(base_score, interaction.timestamp)
            
            product_affinity[interaction.product_id]["score"] += decayed_score
            product_affinity[interaction.product_id]["interactions"].append(interaction.interaction_type)
        
        # Get categories user has shown interest in
        preferred_category_ids = [
            pid for pid, data in sorted(
                product_affinity.items(), 
                key=lambda x: x[1]["score"], 
                reverse=True
            )[:5]
        ]
        
        preferred_categories = self.db.query(Product.category_id)\
            .filter(Product.id.in_(preferred_category_ids))\
            .distinct()\
            .all()
        
        category_ids = [cat[0] for cat in preferred_categories]
        
        # Get similar products from those categories
        similar_products = self.db.query(Product)\
            .filter(
                and_(
                    Product.category_id.in_(category_ids),
                    Product.id.notin_(excluded_ids),
                    Product.id.notin_(list(product_affinity.keys()))
                )
            )\
            .order_by(desc(Product.rating), desc(Product.purchase_count))\
            .limit(limit)\
            .all()
        
        recommendations = []
        for product in similar_products:
            # Calculate score based on category affinity
            category_score = sum(
                data["score"] for pid, data in product_affinity.items()
                if self.db.query(Product.category_id).filter(Product.id == pid).scalar() == product.category_id
            )
            
            normalized_score = min(category_score / 10.0, 1.0)
            
            recommendations.append((
                product,
                normalized_score,
                f"Based on your interest in {product.category.name}"
            ))
        
        return recommendations
    
    def _content_based_recommendations(
        self,
        user: User,
        excluded_ids: Set[int],
        limit: int
    ) -> List[Tuple[Product, float, str]]:
        """
        Content-based filtering using cached TF-IDF similarity
        """
        if not ML_AVAILABLE:
            return []
        
        # Get user's interaction history
        user_products = self.db.query(Product)\
            .join(UserInteraction)\
            .filter(UserInteraction.user_id == user.id)\
            .order_by(desc(UserInteraction.timestamp))\
            .limit(10)\
            .all()
        
        if not user_products:
            return []
        
        try:
            # Get or build cached vectorizer
            vectorizer, product_vectors, product_ids = self._get_or_build_tfidf_cache()
            
            # Create user profile from interacted products
            user_texts = [
                f"{p.name} {p.description} {' '.join(p.tags or [])} {' '.join(p.features or [])}"
                for p in user_products
            ]
            user_profile_text = ' '.join(user_texts)
            
            # Transform user profile
            user_vector = vectorizer.transform([user_profile_text])
            
            # Calculate similarity with all products
            similarities = cosine_similarity(user_vector, product_vectors).flatten()
            
            # Get top similar products
            top_indices = similarities.argsort()[::-1]
            
            recommendations = []
            for idx in top_indices:
                product_id = product_ids[idx]
                
                if product_id in excluded_ids or product_id in [p.id for p in user_products]:
                    continue
                
                product = self.db.query(Product).filter(Product.id == product_id).first()
                if product:
                    recommendations.append((
                        product,
                        float(similarities[idx]),
                        f"Similar to products you've viewed"
                    ))
                
                if len(recommendations) >= limit:
                    break
            
            return recommendations
        except Exception as e:
            print(f"Content-based recommendation error: {e}")
            return []
    
    def _collaborative_filtering_advanced(
        self,
        user: User,
        excluded_ids: Set[int],
        limit: int
    ) -> List[Tuple[Product, float, str]]:
        """
        Advanced collaborative filtering using Matrix Factorization (SVD)
        Falls back to user-user CF if not enough data
        """
        if not ML_AVAILABLE:
            return self._collaborative_filtering_simple(user, excluded_ids, limit)
        
        # Get total interaction count
        total_interactions = self.db.query(func.count(UserInteraction.id)).scalar()
        
        # Need at least 100 interactions for matrix factorization
        if total_interactions < 100:
            return self._collaborative_filtering_simple(user, excluded_ids, limit)
        
        try:
            # Build or get cached user-item matrix
            if self._should_rebuild_matrix():
                self._build_user_item_matrix()
            
            if self._svd_components is None:
                return self._collaborative_filtering_simple(user, excluded_ids, limit)
            
            U, sigma, Vt = self._svd_components
            user_ids_list = self._user_ids_list
            product_ids_list = self._product_ids_list
            
            # Find user index
            if user.id not in user_ids_list:
                return self._collaborative_filtering_simple(user, excluded_ids, limit)
            
            user_idx = user_ids_list.index(user.id)
            
            # Predict ratings for all products
            predicted_ratings = np.dot(np.dot(U[user_idx, :], np.diag(sigma)), Vt)
            
            # Get top products
            top_product_indices = predicted_ratings.argsort()[::-1]
            
            recommendations = []
            for idx in top_product_indices:
                product_id = product_ids_list[idx]
                
                if product_id in excluded_ids:
                    continue
                
                product = self.db.query(Product).filter(Product.id == product_id).first()
                if product:
                    score = (predicted_ratings[idx] - predicted_ratings.min()) / \
                            (predicted_ratings.max() - predicted_ratings.min() + 1e-10)
                    
                    recommendations.append((
                        product,
                        float(score),
                        "Recommended based on similar users"
                    ))
                
                if len(recommendations) >= limit:
                    break
            
            return recommendations
            
        except Exception as e:
            print(f"Matrix factorization error: {e}")
            return self._collaborative_filtering_simple(user, excluded_ids, limit)
    
    def _collaborative_filtering_simple(
        self,
        user: User,
        excluded_ids: Set[int],
        limit: int
    ) -> List[Tuple[Product, float, str]]:
        """
        Simple user-user collaborative filtering (fallback)
        """
        # Get user's interaction pattern
        user_interactions = self.db.query(UserInteraction.product_id, UserInteraction.interaction_type)\
            .filter(UserInteraction.user_id == user.id)\
            .all()
        
        if len(user_interactions) < 3:
            return []
        
        user_product_ids = {interaction.product_id for interaction in user_interactions}
        
        # Find users with overlapping interests
        similar_users = self.db.query(
            UserInteraction.user_id,
            func.count(UserInteraction.id).label('overlap_count')
        )\
            .filter(
                and_(
                    UserInteraction.product_id.in_(user_product_ids),
                    UserInteraction.user_id != user.id
                )
            )\
            .group_by(UserInteraction.user_id)\
            .having(func.count(UserInteraction.id) >= 2)\
            .order_by(desc('overlap_count'))\
            .limit(20)\
            .all()
        
        if not similar_users:
            return []
        
        similar_user_ids = [u.user_id for u in similar_users]
        
        # Get products liked by similar users
        recommended_products = self.db.query(
            Product,
            func.count(UserInteraction.id).label('recommendation_count'),
            func.avg(UserInteraction.interaction_score).label('avg_score')
        )\
            .join(UserInteraction)\
            .filter(
                and_(
                    UserInteraction.user_id.in_(similar_user_ids),
                    Product.id.notin_(excluded_ids),
                    Product.id.notin_(user_product_ids)
                )
            )\
            .group_by(Product.id)\
            .order_by(desc('recommendation_count'), desc('avg_score'))\
            .limit(limit)\
            .all()
        
        recommendations = []
        for product, count, avg_score in recommended_products:
            score = min((count / len(similar_user_ids)) * 0.7 + (avg_score / 5.0) * 0.3, 1.0)
            recommendations.append((
                product,
                score,
                f"Popular with users like you"
            ))
        
        return recommendations
    
    def _get_session_based_recommendations(
        self,
        current_product_id: int,
        user: User,
        excluded_ids: Set[int],
        limit: int = 5
    ) -> List[Tuple[Product, float, str]]:
        """
        "People who viewed X also viewed Y" recommendations
        Based on co-occurrence in user sessions
        """
        # Get recent sessions (last 30 days) that included this product
        recent_date = datetime.utcnow() - timedelta(days=30)
        
        # Find co-viewed products
        co_viewed = self.db.query(
            Product,
            func.count(UserInteraction.user_id.distinct()).label('co_view_count')
        )\
            .join(UserInteraction)\
            .filter(
                and_(
                    UserInteraction.timestamp >= recent_date,
                    UserInteraction.product_id != current_product_id,
                    Product.id.notin_(excluded_ids),
                    UserInteraction.user_id.in_(
                        self.db.query(UserInteraction.user_id)
                        .filter(UserInteraction.product_id == current_product_id)
                        .filter(UserInteraction.timestamp >= recent_date)
                    )
                )
            )\
            .group_by(Product.id)\
            .having(func.count(UserInteraction.user_id.distinct()) >= 2)\
            .order_by(desc('co_view_count'))\
            .limit(limit)\
            .all()
        
        recommendations = []
        for product, count in co_viewed:
            # Normalize score
            score = min(count / 20.0, 1.0)
            
            current_product = self.db.query(Product).filter(Product.id == current_product_id).first()
            reason = "Often viewed together"
            if current_product:
                reason = f"Often viewed with {current_product.name[:30]}..."
            
            recommendations.append((product, score, reason))
        
        return recommendations
    
    def _ensure_diversity(
        self, 
        recommendations: List[ProductWithRecommendationReason],
        min_categories: int = 3
    ) -> List[ProductWithRecommendationReason]:
        """
        Ensure recommendations span multiple categories to avoid filter bubble
        """
        if len(recommendations) < min_categories:
            return recommendations
        
        category_counts = defaultdict(int)
        diverse_recs = []
        remaining_recs = []
        
        max_per_category = max(len(recommendations) // min_categories, 1)
        
        for rec in recommendations:
            if category_counts[rec.category_id] < max_per_category:
                diverse_recs.append(rec)
                category_counts[rec.category_id] += 1
            else:
                remaining_recs.append(rec)
        
        # Add remaining high-scoring items
        diverse_recs.extend(remaining_recs)
        
        return diverse_recs
    
    def _inject_serendipity(
        self,
        recommendations: List[ProductWithRecommendationReason],
        user: User,
        excluded_ids: Set[int],
        serendipity_ratio: float = 0.15
    ) -> List[ProductWithRecommendationReason]:
        """
        Replace some recommendations with high-quality items from unexplored categories
        This encourages exploration and prevents filter bubbles
        """
        if len(recommendations) < 5:
            return recommendations
        
        num_to_replace = max(1, int(len(recommendations) * serendipity_ratio))
        
        # Get user's explored categories
        user_categories = self.db.query(Product.category_id)\
            .join(UserInteraction)\
            .filter(UserInteraction.user_id == user.id)\
            .distinct()\
            .all()
        
        user_category_ids = {cat[0] for cat in user_categories}
        
        # Get all categories
        all_categories = self.db.query(Category.id).all()
        all_category_ids = {cat[0] for cat in all_categories}
        
        # Find unexplored categories
        unexplored_categories = all_category_ids - user_category_ids
        
        if not unexplored_categories:
            return recommendations
        
        # Get high-quality products from unexplored categories
        serendipity_products = self.db.query(Product)\
            .filter(
                and_(
                    Product.category_id.in_(unexplored_categories),
                    Product.id.notin_(excluded_ids),
                    Product.rating >= 4.0,
                    Product.purchase_count >= 5
                )
            )\
            .order_by(desc(Product.rating), desc(Product.purchase_count))\
            .limit(num_to_replace)\
            .all()
        
        # Replace last items with serendipity items
        for i, product in enumerate(serendipity_products):
            if i >= num_to_replace:
                break
            
            product_dict = self._product_to_dict(product)
            product_dict["recommendation_reason"] = f"Discover {product.category.name}"
            product_dict["relevance_score"] = 0.7
            
            # Replace from the end
            if len(recommendations) > num_to_replace:
                recommendations[-(i+1)] = ProductWithRecommendationReason(**product_dict)
        
        return recommendations
    
    # ==================== CACHING & OPTIMIZATION ====================
    
    def _get_or_build_tfidf_cache(self):
        """
        Get cached TF-IDF vectorizer or rebuild if stale (>24 hours)
        """
        cache_lifetime = timedelta(hours=24)
        
        if (self._tfidf_vectorizer is None or 
            self._last_vectorizer_update is None or
            datetime.utcnow() - self._last_vectorizer_update > cache_lifetime):
            
            self._build_tfidf_vectorizer()
        
        return self._tfidf_vectorizer, self._product_vectors, self._product_ids_cache
    
    def _build_tfidf_vectorizer(self):
        """
        Build TF-IDF vectorizer for all products
        """
        products = self.db.query(Product).all()
        
        if not products:
            return
        
        # Create product texts
        product_texts = []
        product_ids = []
        
        for product in products:
            text = f"{product.name} {product.description or ''} "
            text += ' '.join(product.tags or []) + ' '
            text += ' '.join(product.features or [])
            
            product_texts.append(text)
            product_ids.append(product.id)
        
        # Build vectorizer
        vectorizer = TfidfVectorizer(
            max_features=500,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        product_vectors = vectorizer.fit_transform(product_texts)
        
        # Cache
        self._tfidf_vectorizer = vectorizer
        self._product_vectors = product_vectors
        self._product_ids_cache = product_ids
        self._last_vectorizer_update = datetime.utcnow()
    
    def _should_rebuild_matrix(self) -> bool:
        """
        Check if user-item matrix should be rebuilt
        """
        if self._user_item_matrix is None or self._matrix_last_update is None:
            return True
        
        # Rebuild every 6 hours
        return datetime.utcnow() - self._matrix_last_update > timedelta(hours=6)
    
    def _build_user_item_matrix(self):
        """
        Build user-item interaction matrix for collaborative filtering
        """
        try:
            # Get all interactions
            interactions = self.db.query(
                UserInteraction.user_id,
                UserInteraction.product_id,
                UserInteraction.interaction_type,
                UserInteraction.timestamp
            ).all()
            
            if len(interactions) < 50:
                return
            
            # Get unique users and products
            user_ids = sorted(list(set([i.user_id for i in interactions])))
            product_ids = sorted(list(set([i.product_id for i in interactions])))
            
            # Create user and product index mappings
            user_id_to_idx = {uid: idx for idx, uid in enumerate(user_ids)}
            product_id_to_idx = {pid: idx for idx, pid in enumerate(product_ids)}
            
            # Build sparse matrix
            rows, cols, data = [], [], []
            
            for interaction in interactions:
                user_idx = user_id_to_idx[interaction.user_id]
                product_idx = product_id_to_idx[interaction.product_id]
                
                # Calculate score with time decay
                base_score = self.interaction_weights.get(interaction.interaction_type, 1.0)
                score = self._apply_time_decay(base_score, interaction.timestamp)
                
                rows.append(user_idx)
                cols.append(product_idx)
                data.append(score)
            
            # Create sparse matrix
            matrix = csr_matrix(
                (data, (rows, cols)),
                shape=(len(user_ids), len(product_ids))
            )
            
            # Perform SVD (matrix factorization)
            k = min(20, min(matrix.shape) - 1)  # Number of latent factors
            
            if k >= 2:
                U, sigma, Vt = svds(matrix, k=k)
                
                # Cache results
                self._svd_components = (U, sigma, Vt)
                self._user_ids_list = user_ids
                self._product_ids_list = product_ids
                self._user_item_matrix = matrix
                self._matrix_last_update = datetime.utcnow()
            
        except Exception as e:
            print(f"Error building user-item matrix: {e}")
            self._svd_components = None
    
    # ==================== HELPER METHODS ====================
    
    def _get_user_viewed_products(self, user_id: int) -> Set[int]:
        """Get IDs of products user has already viewed or purchased"""
        viewed = self.db.query(UserInteraction.product_id)\
            .filter(UserInteraction.user_id == user_id)\
            .distinct()\
            .all()
        
        purchased = self.db.query(Purchase.product_id)\
            .filter(Purchase.user_id == user_id)\
            .distinct()\
            .all()
        
        return {p[0] for p in viewed} | {p[0] for p in purchased}
    
    def _get_products_by_categories(
        self,
        category_ids: List[int],
        excluded_ids: Set[int],
        limit: int,
        min_rating: float = 0.0
    ) -> List[Tuple[Product, float]]:
        """Get top products from specified categories with quality filter"""
        query = self.db.query(Product)\
            .filter(
                and_(
                    Product.category_id.in_(category_ids),
                    Product.id.notin_(excluded_ids)
                )
            )
        
        if min_rating > 0:
            query = query.filter(Product.rating >= min_rating)
        
        products = query\
            .order_by(desc(Product.rating), desc(Product.purchase_count))\
            .limit(limit)\
            .all()
        
        return [(p, 0.8) for p in products]
    
    def _get_products_by_tags(
        self,
        tags: List[str],
        excluded_ids: Set[int],
        limit: int
    ) -> List[Tuple[Product, float]]:
        """Get products matching interest tags using database-level filtering"""
        # Use PostgreSQL array operations if available, otherwise fallback
        try:
            # This works with PostgreSQL ARRAY type
            products = self.db.query(Product)\
                .filter(
                    and_(
                        Product.id.notin_(excluded_ids),
                        Product.tags.overlap(tags)  # PostgreSQL array overlap
                    )
                )\
                .order_by(desc(Product.rating))\
                .limit(limit * 2)\
                .all()
            
            # Calculate scores based on tag overlap
            scored_products = []
            for product in products:
                if product.tags:
                    matching_tags = set(tags) & set(product.tags)
                    score = len(matching_tags) / len(tags) if tags else 0
                    scored_products.append((product, score))
            
            scored_products.sort(key=lambda x: x[1], reverse=True)
            return scored_products[:limit]
            
        except:
            # Fallback for non-PostgreSQL or when tags is not an array type
            all_products = self.db.query(Product)\
                .filter(Product.id.notin_(excluded_ids))\
                .all()
            
            scored_products = []
            for product in all_products:
                if product.tags:
                    matching_tags = set(tags) & set(product.tags)
                    if matching_tags:
                        score = len(matching_tags) / len(tags)
                        scored_products.append((product, score))
            
            scored_products.sort(key=lambda x: x[1], reverse=True)
            return scored_products[:limit]
    
    def _get_budget_aware_popular(
        self,
        budget_range,
        excluded_ids: Set[int],
        limit: int
    ) -> List[Tuple[Product, float]]:
        """Get popular products within budget range"""
        price_ranges = {
            "low": (0, 50),
            "medium": (50, 200),
            "high": (200, 100000)
        }

        # Support both legacy string ranges and onboarding slider [min, max] values.
        if isinstance(budget_range, (list, tuple)) and len(budget_range) == 2:
            min_price, max_price = float(budget_range[0]), float(budget_range[1])
        elif isinstance(budget_range, str):
            min_price, max_price = price_ranges.get(budget_range, (0, 100000))
        else:
            min_price, max_price = (0, 100000)
        
        products = self.db.query(Product)\
            .filter(
                and_(
                    Product.price >= min_price,
                    Product.price <= max_price,
                    Product.id.notin_(excluded_ids)
                )
            )\
            .order_by(desc(Product.purchase_count), desc(Product.rating))\
            .limit(limit)\
            .all()
        
        return [(p, 0.7) for p in products]
    
    def _get_trending_products(
        self,
        excluded_ids: Set[int],
        limit: int,
        min_rating: float = 0.0
    ) -> List[Tuple[Product, float]]:
        """Get currently trending products with quality filter"""
        recent_date = datetime.utcnow() - timedelta(days=7)
        
        # Get products with recent interactions
        trending_query = self.db.query(
            Product,
            func.count(UserInteraction.id).label('recent_views')
        )\
            .join(UserInteraction)\
            .filter(
                and_(
                    Product.id.notin_(excluded_ids),
                    UserInteraction.timestamp >= recent_date
                )
            )
        
        if min_rating > 0:
            trending_query = trending_query.filter(Product.rating >= min_rating)
        
        trending_with_interactions = trending_query\
            .group_by(Product.id)\
            .order_by(desc('recent_views'), desc(Product.rating))\
            .limit(limit)\
            .all()
        
        # Fallback to highly rated products if no recent interactions
        if not trending_with_interactions:
            fallback_query = self.db.query(Product)\
                .filter(Product.id.notin_(excluded_ids))
            
            if min_rating > 0:
                fallback_query = fallback_query.filter(Product.rating >= min_rating)
            
            trending_fallback = fallback_query\
                .order_by(desc(Product.rating), desc(Product.purchase_count))\
                .limit(limit)\
                .all()
            
            return [(p, 0.5) for p in trending_fallback]
        
        return [(p, 0.6) for p, _ in trending_with_interactions]
    
    def _deduplicate_recommendations(
        self,
        recommendations: List[ProductWithRecommendationReason],
        limit: int
    ) -> List[ProductWithRecommendationReason]:
        """Remove duplicate recommendations and limit results"""
        seen_ids = set()
        unique_recs = []
        
        for rec in recommendations:
            if rec.id not in seen_ids:
                seen_ids.add(rec.id)
                unique_recs.append(rec)
                if len(unique_recs) >= limit:
                    break
        
        return unique_recs
    
    def _product_to_dict(self, product: Product) -> dict:
        """Convert Product model to dictionary"""
        return {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "category_id": product.category_id,
            "brand": product.brand,
            "image_url": product.image_url,
            "stock": product.stock,
            "tags": product.tags,
            "features": product.features,
            "view_count": product.view_count,
            "purchase_count": product.purchase_count,
            "rating": product.rating,
            "created_at": product.created_at
        }
    
    # ==================== ANALYTICS & FEEDBACK ====================
    
    def track_recommendation_feedback(
        self,
        user_id: int,
        product_id: int,
        position: int,
        clicked: bool,
        strategy_used: str
    ):
        """
        Track whether user clicked on a recommendation
        This data can be used for CTR optimization and A/B testing
        
        Note: Requires a RecommendationFeedback model to be added to models.py
        """
        # This would insert into a recommendation_feedback table
        # For now, just a placeholder for the implementation
        pass
    
    def get_recommendation_performance_metrics(self, days: int = 30) -> Dict:
        """
        Get performance metrics for different recommendation strategies
        Returns CTR, conversion rate, etc.
        """
        # Placeholder for analytics implementation
        return {
            "cold_start_ctr": 0.0,
            "behavioral_ctr": 0.0,
            "collaborative_ctr": 0.0,
            "overall_ctr": 0.0
        }

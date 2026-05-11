'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { useAuthStore } from '@/lib/store/auth'
import { authAPI } from '@/lib/api/auth'
import { toast } from 'sonner'
import { ChevronRight } from 'lucide-react'

const CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Sports',
  'Books',
  'Beauty',
  'Toys',
  'Food & Groceries',
]

const INTERESTS = [
  'Shopping frequently',
  'Finding deals',
  'Discovering new items',
  'Quality over price',
  'Latest trends',
  'Eco-friendly products',
]

interface OnboardingState {
  step: number
  categories: string[]
  budgetRange: [number, number]
  interests: string[]
}

export function OnboardingForm() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [state, setState] = useState<OnboardingState>({
    step: 0,
    categories: [],
    budgetRange: [100, 1000],
    interests: [],
  })

  const handleCategoryToggle = (category: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  const handleInterestToggle = (interest: string) => {
    setState((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleBudgetChange = (value: number[]) => {
    setState((prev) => ({
      ...prev,
      budgetRange: [value[0], value[1]],
    }))
  }

  const handleNext = () => {
    if (state.step === 1 && state.categories.length === 0) {
      toast.error('Please select at least one category')
      return
    }
    if (state.step === 3 && state.interests.length === 0) {
      toast.error('Please select at least one interest')
      return
    }
    setState((prev) => ({ ...prev, step: prev.step + 1 }))
  }

  const handlePrevious = () => {
    setState((prev) => ({ ...prev, step: Math.max(0, prev.step - 1) }))
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const updatedUser = await authAPI.onboarding({
        categories: state.categories,
        budget_range: state.budgetRange,
        interests: state.interests,
      })

      const userWithPreferences = {
        ...updatedUser,
        preferences: {
          categories: state.categories,
          budget_range: state.budgetRange,
          interests: state.interests,
        }
      }
      setUser(userWithPreferences)
      
      // Set onboarding-completed cookie for middleware
      document.cookie = 'onboarding-completed=true; path=/; max-age=31536000'
      
      // Set is-admin cookie if user is admin
      if (updatedUser.is_admin) {
        document.cookie = `is-admin=true; path=/; max-age=86400`
      }
      
      toast.success('Onboarding completed!')
      router.push('/dashboard')
    } catch (error) {
      console.error('[v0] Onboarding error:', error)
      toast.error('Failed to complete onboarding')
    } finally {
      setIsLoading(false)
    }
  }

  const progressValue = ((state.step + 1) / 4) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <div className="p-8">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-3xl font-bold">Let&apos;s personalize your experience</h1>
              <span className="text-sm font-medium text-muted-foreground">
                Step {state.step + 1} of 4
              </span>
            </div>
            <Progress value={progressValue} className="mt-4" />
          </div>

          {/* Steps */}
          <AnimatePresence mode="wait">
            {state.step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center py-12">
                  <h2 className="text-2xl font-semibold mb-4">Welcome, {user?.username}!</h2>
                  <p className="text-muted-foreground mb-2">
                    We&apos;ll help you discover products tailored to your preferences.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    This should only take a minute
                  </p>
                </div>
              </motion.div>
            )}

            {state.step === 1 && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-2">What categories interest you?</h2>
                  <p className="text-muted-foreground mb-4">Select at least one</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        state.categories.includes(category)
                          ? 'border-primary bg-primary/10 font-medium'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {state.step === 2 && (
              <motion.div
                key="budget"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-2">What&apos;s your typical budget?</h2>
                  <p className="text-muted-foreground mb-6">
                    ${state.budgetRange[0]} - ${state.budgetRange[1]} per purchase
                  </p>
                </div>
                <div className="space-y-4 px-4">
                  <Slider
                    defaultValue={state.budgetRange}
                    min={10}
                    max={5000}
                    step={50}
                    onValueChange={handleBudgetChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>$10</span>
                    <span>$5,000</span>
                  </div>
                </div>
              </motion.div>
            )}

            {state.step === 3 && (
              <motion.div
                key="interests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-2">How do you like to shop?</h2>
                  <p className="text-muted-foreground mb-4">Select at least one</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`px-4 py-2 rounded-full border-2 transition-all text-sm font-medium ${
                        state.interests.includes(interest)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {state.step === 4 && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center py-8">
                  <h2 className="text-2xl font-semibold mb-4">You&apos;re all set!</h2>
                  <p className="text-muted-foreground mb-6">
                    Here&apos;s your personalization profile:
                  </p>

                  <div className="grid md:grid-cols-3 gap-4 text-left">
                    <Card className="p-4 bg-card/50">
                      <p className="text-xs text-muted-foreground font-medium mb-2">CATEGORIES</p>
                      <div className="space-y-1">
                        {state.categories.slice(0, 3).map((cat) => (
                          <p key={cat} className="text-sm font-medium">
                            {cat}
                          </p>
                        ))}
                        {state.categories.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{state.categories.length - 3} more
                          </p>
                        )}
                      </div>
                    </Card>

                    <Card className="p-4 bg-card/50">
                      <p className="text-xs text-muted-foreground font-medium mb-2">BUDGET</p>
                      <p className="text-lg font-bold">
                        ${state.budgetRange[0]} - ${state.budgetRange[1]}
                      </p>
                    </Card>

                    <Card className="p-4 bg-card/50">
                      <p className="text-xs text-muted-foreground font-medium mb-2">INTERESTS</p>
                      <div className="space-y-1">
                        {state.interests.slice(0, 2).map((int) => (
                          <p key={int} className="text-sm font-medium">
                            {int}
                          </p>
                        ))}
                        {state.interests.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{state.interests.length - 2} more
                          </p>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex gap-4 mt-8">
            {state.step > 0 && (
              <Button variant="outline" onClick={handlePrevious} className="flex-1">
                Back
              </Button>
            )}
            {state.step < 4 ? (
              <Button onClick={handleNext} className="flex-1">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isLoading} className="flex-1">
                {isLoading ? 'Completing...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

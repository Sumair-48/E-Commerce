import { Metadata } from 'next'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'

export const metadata: Metadata = {
  title: 'Personalize Your Experience',
  description: 'Set up your preferences for personalized recommendations',
}

export default function OnboardingPage() {
  return <OnboardingForm />
}

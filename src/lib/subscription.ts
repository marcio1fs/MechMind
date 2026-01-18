import { Timestamp } from 'firebase/firestore';

export type Plan = 'PREMIUM' | 'PRO+' | 'PRO';

export type SubscriptionDetails = {
    plan: Plan;
    status: 'AVALIAÇÃO' | 'ASSINATURA ATIVA' | 'AVALIAÇÃO EXPIRADA';
    trialEndDate: Date | null;
    daysRemaining: number | null;
};

// This represents the part of the user profile needed for subscription logic.
type UserProfileForPlan = {
    createdAt?: Timestamp;
    // In a real app, this would come from a Stripe/payment provider integration.
    // For now, we assume if trial is over, they need to pay, but we don't have a paid status.
    // Let's assume anyone past trial is on PRO unless they have a specific subscription field.
};

const TRIAL_DURATION_DAYS = 30;

/**
 * Determines the user's subscription details based on their signup date.
 * Simulates a 30-day PREMIUM trial.
 * @param profile - The user's profile, containing at least the `createdAt` timestamp.
 * @returns An object with the user's current plan, status, and trial details.
 */
export const getSubscriptionDetails = (profile?: UserProfileForPlan | null): SubscriptionDetails => {
    if (!profile || !profile.createdAt) {
        // Fallback for users without a creation date. They are on the base plan and need to subscribe.
        return {
            plan: 'PRO',
            status: 'AVALIAÇÃO EXPIRADA',
            trialEndDate: null,
            daysRemaining: null,
        };
    }

    const now = new Date();
    const signUpDate = profile.createdAt.toDate();
    const trialEndDate = new Date(signUpDate);
    trialEndDate.setDate(signUpDate.getDate() + TRIAL_DURATION_DAYS);
    
    const daysSinceSignUp = (now.getTime() - signUpDate.getTime()) / (1000 * 3600 * 24);

    if (daysSinceSignUp <= TRIAL_DURATION_DAYS) {
        // User is within the trial period. They have access to PREMIUM features.
        const daysRemaining = Math.ceil(TRIAL_DURATION_DAYS - daysSinceSignUp);
        return {
            plan: 'PREMIUM',
            status: 'AVALIAÇÃO',
            trialEndDate: trialEndDate,
            daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        };
    }

    // Trial has ended. User reverts to the base plan and needs to subscribe to a paid plan.
    // A real app would check for an active subscription here.
    return {
        plan: 'PRO',
        status: 'AVALIAÇÃO EXPIRADA',
        trialEndDate: trialEndDate,
        daysRemaining: 0,
    };
};


/**
 * A simple helper to get only the active plan name for a user.
 * This is useful for components that only need to gate features.
 * @param profile - The user's profile, containing at least the `createdAt` timestamp.
 * @returns The user's current plan name.
 */
export const getUserPlan = (profile?: UserProfileForPlan | null): Plan => {
    return getSubscriptionDetails(profile).plan;
}

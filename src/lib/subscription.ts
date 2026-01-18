import { Timestamp } from 'firebase/firestore';

export type Plan = 'PREMIUM' | 'PRO+' | 'PRO';

export const getActivePlan = (createdAt?: Timestamp): Plan => {
    if (!createdAt) {
        // Users without a creation date are considered to be on the basic plan, needing to subscribe.
        return 'PRO';
    }

    const now = new Date();
    const signUpDate = createdAt.toDate();
    const daysSinceSignUp = (now.getTime() - signUpDate.getTime()) / (1000 * 3600 * 24);

    // First 5 days: PREMIUM
    if (daysSinceSignUp <= 5) {
        return 'PREMIUM';
    }
    
    // Days 6 to 13: PRO+
    if (daysSinceSignUp <= 13) {
        return 'PRO+';
    }
    
    // From day 14 onwards, including after the 30-day trial might have conceptually ended,
    // they are on the PRO plan until they actively subscribe to a higher tier.
    return 'PRO';
}

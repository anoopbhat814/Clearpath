import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { ReferralForm } from '@/components/ReferralForm';

export const metadata: Metadata = { title: 'New referral' };

export default function NewReferralPage() {
  return (
    <>
      <PageHeader title="New referral" subtitle="Referrals are submitted straight into the triage queue" />
      <ReferralForm />
    </>
  );
}

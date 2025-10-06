import { redirect } from 'next/navigation';

export default function OperatorDashboardRedirect() {
  // Redirect legacy /operator/dashboard to the current operator home
  redirect('/operator');
}



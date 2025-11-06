"use client";

import ProtectedRoute from '../components/ProtectedRoute';
import DashboardContent from '../page';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
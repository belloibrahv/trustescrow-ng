'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, AlertCircle, CheckCircle, Clock, Gavel } from 'lucide-react';
import { adminApi } from '@/lib/api';

interface Dispute {
  id: string;
  status: string;
  reason?: string;
  resolution?: string;
  createdAt: string;
  deal: {
    id: string;
    dealRef: string;
    itemDescription: string;
    amountKobo: string;
    buyer: {
      phone: string;
      fullName?: string;
    };
    seller: {
      phone: string;
      fullName?: string;
    };
  };
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = useCallback(async () => {
    try {
      // Fetch all deals with disputes using the admin API
      const { data } = await adminApi.getDeals();
      const dealsWithDisputes = data.deals.filter((deal: any) => deal.dispute);
      setDisputes(dealsWithDisputes.map((deal: any) => ({
        ...deal.dispute,
        deal: {
          id: deal.id,
          dealRef: deal.dealRef,
          itemDescription: deal.itemDescription,
          amountKobo: deal.amountKobo,
          buyer: deal.buyer,
          seller: deal.seller,
        },
      })));
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  if (loading) {
    return <div className="text-center py-12">Loading disputes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg shadow-red-500/30">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Disputes Management</h1>
          </div>
          <p className="text-gray-600">Review and resolve open disputes</p>
        </div>
        <div className="px-4 py-2 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl">
          <span className="text-sm font-semibold text-red-700">
            {disputes.length} {disputes.length === 1 ? 'Dispute' : 'Disputes'}
          </span>
        </div>
      </div>

      {disputes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Active Disputes</h3>
          <p className="text-gray-600">All deals are running smoothly! 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all">
              <div className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        {dispute.deal.dealRef}
                      </h3>
                      <DisputeStatusBadge status={dispute.status} />
                    </div>

                    <p className="text-gray-700 font-medium mb-6 text-lg">{dispute.deal.itemDescription}</p>

                    {/* Grid Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <span className="text-sm text-blue-600 font-medium">👤 Buyer:</span>
                        <span className="font-semibold text-blue-900">
                          {dispute.deal.buyer.fullName || dispute.deal.buyer.phone}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                        <span className="text-sm text-green-600 font-medium">🛒 Seller:</span>
                        <span className="font-semibold text-green-900">
                          {dispute.deal.seller.fullName || dispute.deal.seller.phone}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-200">
                        <span className="text-sm text-purple-600 font-medium">💰 Amount:</span>
                        <span className="font-bold text-purple-900">
                          ₦{(Number(dispute.deal.amountKobo) / 100).toLocaleString('en-NG')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl border border-orange-200">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-orange-600 font-medium">Opened:</span>
                        <span className="font-semibold text-orange-900">
                          {formatDistanceToNow(new Date(dispute.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {/* Reason */}
                    {dispute.reason && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <div className="text-xs font-bold text-red-800 uppercase tracking-wider">Dispute Reason</div>
                        </div>
                        <div className="text-sm text-red-900 font-medium">{dispute.reason}</div>
                      </div>
                    )}

                    {/* Resolution */}
                    {dispute.resolution && (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <div className="text-xs font-bold text-green-800 uppercase tracking-wider">Resolution</div>
                        </div>
                        <div className="text-sm text-green-900 font-medium">{dispute.resolution}</div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 ml-6">
                    <Link
                      href={`/deals/${dispute.deal.id}`}
                      className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all whitespace-nowrap"
                    >
                      View Deal <ExternalLink className="w-4 h-4" />
                    </Link>

                    {(dispute.status === 'OPEN' || dispute.status === 'ESCALATED') && (
                      <Link
                        href={`/disputes/${dispute.id}/resolve`}
                        className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all whitespace-nowrap"
                      >
                        <Gavel className="w-4 h-4" />
                        Resolve
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// DisputeStatusBadge component - Memoized
const DisputeStatusBadge = memo(function DisputeStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OPEN: 'bg-red-100 text-red-800 border border-red-300',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    RESOLVED: 'bg-green-100 text-green-800 border border-green-300',
    ESCALATED: 'bg-purple-100 text-purple-800 border border-purple-300',
  };

  return (
    <span
      className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider ${
        colors[status] || 'bg-gray-100 text-gray-800 border border-gray-300'
      }`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
});

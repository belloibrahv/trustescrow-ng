'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Search } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';

interface Deal {
  id: string;
  dealRef: string;
  status: string;
  amountKobo: string;
  feeKobo: string;
  itemDescription: string;
  createdAt: string;
  buyer: {
    phone: string;
    fullName?: string;
  };
  seller: {
    phone: string;
    fullName?: string;
  };
}

export default function DealsPage() {
  const { loading: authLoading } = useRequireAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const fetchDeals = useCallback(async () => {
    try {
      const { data } = await adminApi.getDeals();
      setDeals(data.deals || data);
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchDeals();
    }
  }, [authLoading, fetchDeals]);

  const filteredDeals = deals.filter((deal) => {
    const matchesFilter = filter === 'all' || deal.status === filter;
    const matchesSearch =
      search === '' ||
      deal.dealRef.toLowerCase().includes(search.toLowerCase()) ||
      deal.buyer.phone.includes(search) ||
      deal.seller.phone.includes(search) ||
      deal.itemDescription.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (authLoading || loading) {
    return <div className="text-center py-12">Loading deals...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deals Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage all escrow transactions</p>
        </div>
        <div className="px-4 py-2 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
          <span className="text-sm font-semibold text-emerald-700">
            {filteredDeals.length} {filteredDeals.length === 1 ? 'Deal' : 'Deals'}
          </span>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by deal ref, phone, or item description..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <select
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white text-gray-900 font-medium"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="INITIATED">Initiated</option>
            <option value="BUYER_VERIFIED">Buyer Verified</option>
            <option value="BOTH_VERIFIED">Both Verified</option>
            <option value="TERMS_AGREED">Terms Agreed</option>
            <option value="PAYMENT_PENDING">Payment Pending</option>
            <option value="FUNDS_HELD">Funds Held</option>
            <option value="AWAITING_CONFIRMATION">Awaiting Confirmation</option>
            <option value="COMPLETED">Completed</option>
            <option value="REFUNDED">Refunded</option>
            <option value="DISPUTE_OPEN">Dispute Open</option>
          </select>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Deal Ref
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Parties
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{deal.dealRef}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="flex items-center mb-1">
                        <span className="text-blue-600 font-medium">👤 Buyer:</span>
                        <span className="ml-2 text-gray-900">{deal.buyer.fullName || deal.buyer.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-600 font-medium">🛒 Seller:</span>
                        <span className="ml-2 text-gray-900">{deal.seller.fullName || deal.seller.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate font-medium">
                      {deal.itemDescription}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      ₦{(Number(deal.amountKobo) / 100).toLocaleString('en-NG')}
                    </div>
                    <div className="text-xs text-emerald-600 font-medium">
                      Fee: ₦{(Number(deal.feeKobo) / 100).toLocaleString('en-NG')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={deal.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                    {formatDistanceToNow(new Date(deal.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/deals/${deal.id}`}
                      className="inline-flex items-center gap-1 px-3 py-2 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-lg transition-all font-medium border border-emerald-600"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDeals.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No deals found matching your filters.</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

// StatusBadge component - Memoized
const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    INITIATED: 'bg-gray-100 text-gray-800 border border-gray-300',
    BUYER_VERIFIED: 'bg-blue-100 text-blue-800 border border-blue-300',
    BOTH_VERIFIED: 'bg-blue-100 text-blue-800 border border-blue-300',
    TERMS_AGREED: 'bg-purple-100 text-purple-800 border border-purple-300',
    PAYMENT_PENDING: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    FUNDS_HELD: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    AWAITING_CONFIRMATION: 'bg-orange-100 text-orange-800 border border-orange-300',
    COMPLETED: 'bg-green-100 text-green-800 border border-green-300',
    REFUNDED: 'bg-red-100 text-red-800 border border-red-300',
    DISPUTE_OPEN: 'bg-red-100 text-red-800 border border-red-300',
  };

  return (
    <span
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
        colors[status] || 'bg-gray-100 text-gray-800 border border-gray-300'
      }`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
});

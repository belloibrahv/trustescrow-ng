'use client';

import { useState, useCallback, memo } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';

interface User {
  id: string;
  phone: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  bvnVerified: boolean;
  ninHash?: string;
  consentGiven: boolean;
  dealCount: number;
  createdAt: string;
  buyerDeals: any[];
  sellerDeals: any[];
}

export default function UsersPage() {
  const [phone, setPhone] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    setError('');
    setUser(null);

    try {
      const { data } = await adminApi.getUser(phone.trim());
      setUser(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'User not found');
    } finally {
      setLoading(false);
    }
  }, [phone]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Lookup</h1>
        <p className="text-gray-600 mt-1">Search and view detailed user information and activity</p>
      </div>

      {/* Search Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <form onSubmit={searchUser} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter phone number (e.g., +2348012345678 or 08012345678)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 flex items-center justify-center"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search User
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}
      </div>

      {user && (
        <div className="space-y-6">
          {/* User Info Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-1">{user.fullName || 'User Profile'}</h2>
                <p className="text-emerald-100 font-medium">{user.phone}</p>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center">
                    <div className="w-1 h-5 bg-emerald-500 rounded-full mr-2"></div>
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <InfoRow label="Full Name" value={user.fullName || 'Not provided'} />
                    <InfoRow label="Phone" value={user.phone} />
                    <InfoRow label="Date of Birth" value={user.dateOfBirth || 'Not provided'} />
                    <InfoRow label="Gender" value={user.gender || 'Not provided'} />
                  </div>
                </div>

                {/* Verification Status */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center">
                    <div className="w-1 h-5 bg-blue-500 rounded-full mr-2"></div>
                    Verification Status
                  </h3>
                  <div className="space-y-3">
                    <InfoRow
                      label="NIN Verified"
                      value={
                        user.ninHash ? (
                          <span className="flex items-center text-green-600 font-semibold">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600 font-semibold">
                            <XCircle className="w-4 h-4 mr-1" />
                            Not Verified
                          </span>
                        )
                      }
                    />
                    <InfoRow
                      label="BVN Verified"
                      value={
                        user.bvnVerified ? (
                          <span className="flex items-center text-green-600 font-semibold">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600 font-semibold">
                            <XCircle className="w-4 h-4 mr-1" />
                            Not Verified
                          </span>
                        )
                      }
                    />
                    <InfoRow
                      label="NDPR Consent"
                      value={
                        user.consentGiven ? (
                          <span className="flex items-center text-green-600 font-semibold">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Given
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600 font-semibold">
                            <XCircle className="w-4 h-4 mr-1" />
                            Not Given
                          </span>
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Activity Summary */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-6 flex items-center">
                  <div className="w-1 h-5 bg-purple-500 rounded-full mr-2"></div>
                  Activity Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{user.dealCount}</div>
                    <div className="text-sm text-gray-600 font-medium">Total Deals</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="text-3xl font-bold text-blue-900 mb-1">{user.buyerDeals.length}</div>
                    <div className="text-sm text-blue-700 font-medium">As Buyer</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl border border-emerald-200">
                    <div className="text-3xl font-bold text-green-900 mb-1">{user.sellerDeals.length}</div>
                    <div className="text-sm text-green-700 font-medium">As Seller</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Deals */}
          {(user.buyerDeals.length > 0 || user.sellerDeals.length > 0) && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <div className="w-1 h-6 bg-emerald-500 rounded-full mr-3"></div>
                Recent Deals
              </h3>
              <div className="space-y-3">
                {[...user.buyerDeals, ...user.sellerDeals]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">{deal.dealRef}</div>
                        <div className="text-sm text-gray-600">{deal.itemDescription}</div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-bold text-gray-900 mb-1">
                          ₦{(Number(deal.amountKobo) / 100).toLocaleString('en-NG')}
                        </div>
                        <div className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-lg font-medium">
                          {deal.status.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// InfoRow component - Memoized
const InfoRow = memo(function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 font-medium">{label}:</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
});

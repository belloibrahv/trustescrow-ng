'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ArrowLeft, MessageSquare, FileText, AlertCircle, CheckCircle, XCircle, User, Phone, Shield, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface DealDetail {
  id: string;
  dealRef: string;
  status: string;
  amountKobo: string;
  feeKobo: string;
  itemDescription: string;
  createdAt: string;
  resolvedAt?: string;
  buyer: {
    id: string;
    phone: string;
    fullName?: string;
    ninHash?: string;
    bvnVerified: boolean;
  };
  seller: {
    id: string;
    phone: string;
    fullName?: string;
    ninHash?: string;
    bvnVerified: boolean;
  };
  messages: Array<{
    id: string;
    direction: string;
    body: string;
    intent?: string;
    createdAt: string;
    user: {
      phone: string;
    };
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    actorType: string;
    createdAt: string;
    payload: any;
  }>;
  dispute?: {
    id: string;
    status: string;
    reason?: string;
    resolution?: string;
    createdAt: string;
  };
}

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'messages' | 'audit' | 'dispute'>('messages');

  useEffect(() => {
    fetchDeal();
  }, [resolvedParams.id]);

  const fetchDeal = async () => {
    try {
      const { data } = await axios.get(`http://localhost:3000/api/admin/deals/${resolvedParams.id}`);
      setDeal(data);
    } catch (error) {
      console.error('Failed to fetch deal:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl shadow-emerald-500/20 mb-4">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading deal details...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Deal Not Found</h3>
          <p className="text-gray-600 mb-6">The deal you're looking for doesn't exist or has been removed.</p>
          <Link
            href="/deals"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/30 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/deals"
        className="inline-flex items-center px-4 py-2 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-xl transition-all font-medium border border-emerald-600"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Deals
      </Link>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-3">{deal.dealRef}</h1>
            <p className="text-emerald-100 text-lg font-medium">{deal.itemDescription}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div className="text-xs font-semibold text-gray-600 uppercase">Amount</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ₦{(Number(deal.amountKobo) / 100).toLocaleString('en-NG')}
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1">
              Fee: ₦{(Number(deal.feeKobo) / 100).toLocaleString('en-NG')}
            </div>
          </div>
          
          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <div className="text-xs font-semibold text-gray-600 uppercase">Status</div>
            </div>
            <div className="text-lg font-bold text-blue-600">{deal.status.replace(/_/g, ' ')}</div>
          </div>
          
          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div className="text-xs font-semibold text-gray-600 uppercase">Created</div>
            </div>
            <div className="text-sm font-medium text-gray-900">{format(new Date(deal.createdAt), 'PPp')}</div>
          </div>
          
          {deal.resolvedAt ? (
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="text-xs font-semibold text-gray-600 uppercase">Resolved</div>
              </div>
              <div className="text-sm font-medium text-gray-900">{format(new Date(deal.resolvedAt), 'PPp')}</div>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div className="text-xs font-semibold text-orange-700 uppercase">Status</div>
              </div>
              <div className="text-sm font-bold text-orange-900">In Progress</div>
            </div>
          )}
        </div>

        {/* Parties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 border-b border-gray-200">
          {/* Buyer Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-xl text-blue-900">Buyer</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start justify-between py-2 border-b border-blue-200">
                <span className="text-sm text-blue-700 font-medium">Name:</span>
                <span className="font-semibold text-blue-900 text-right">{deal.buyer.fullName || 'Not verified'}</span>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-blue-200">
                <span className="text-sm text-blue-700 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone:
                </span>
                <span className="font-semibold text-blue-900">{deal.buyer.phone}</span>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-blue-200">
                <span className="text-sm text-blue-700 font-medium">NIN:</span>
                <span className={`font-semibold flex items-center gap-1 ${deal.buyer.ninHash ? 'text-green-600' : 'text-red-600'}`}>
                  {deal.buyer.ninHash ? <><CheckCircle className="w-4 h-4" /> Verified</> : <><XCircle className="w-4 h-4" /> Not verified</>}
                </span>
              </div>
              <div className="flex items-start justify-between py-2">
                <span className="text-sm text-blue-700 font-medium">BVN:</span>
                <span className={`font-semibold flex items-center gap-1 ${deal.buyer.bvnVerified ? 'text-green-600' : 'text-red-600'}`}>
                  {deal.buyer.bvnVerified ? <><CheckCircle className="w-4 h-4" /> Verified</> : <><XCircle className="w-4 h-4" /> Not verified</>}
                </span>
              </div>
            </div>
          </div>

          {/* Seller Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-xl text-green-900">Seller</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start justify-between py-2 border-b border-green-200">
                <span className="text-sm text-green-700 font-medium">Name:</span>
                <span className="font-semibold text-green-900 text-right">{deal.seller.fullName || 'Not verified'}</span>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-green-200">
                <span className="text-sm text-green-700 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone:
                </span>
                <span className="font-semibold text-green-900">{deal.seller.phone}</span>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-green-200">
                <span className="text-sm text-green-700 font-medium">NIN:</span>
                <span className={`font-semibold flex items-center gap-1 ${deal.seller.ninHash ? 'text-green-600' : 'text-red-600'}`}>
                  {deal.seller.ninHash ? <><CheckCircle className="w-4 h-4" /> Verified</> : <><XCircle className="w-4 h-4" /> Not verified</>}
                </span>
              </div>
              <div className="flex items-start justify-between py-2">
                <span className="text-sm text-green-700 font-medium">BVN:</span>
                <span className={`font-semibold flex items-center gap-1 ${deal.seller.bvnVerified ? 'text-green-600' : 'text-red-600'}`}>
                  {deal.seller.bvnVerified ? <><CheckCircle className="w-4 h-4" /> Verified</> : <><XCircle className="w-4 h-4" /> Not verified</>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-1 px-6">
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-4 px-6 font-semibold text-sm flex items-center gap-2 transition-all rounded-t-lg ${
                activeTab === 'messages'
                  ? 'bg-white border-b-4 border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Messages
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                {deal.messages.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-4 px-6 font-semibold text-sm flex items-center gap-2 transition-all rounded-t-lg ${
                activeTab === 'audit'
                  ? 'bg-white border-b-4 border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Audit Log
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {deal.auditLogs.length}
              </span>
            </button>
            {deal.dispute && (
              <button
                onClick={() => setActiveTab('dispute')}
                className={`py-4 px-6 font-semibold text-sm flex items-center gap-2 transition-all rounded-t-lg ${
                  activeTab === 'dispute'
                    ? 'bg-white border-b-4 border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                Dispute
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">!</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8 bg-white">
          {activeTab === 'messages' && (
            <div className="space-y-4">
              {deal.messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No messages yet</p>
                </div>
              ) : (
                deal.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-5 rounded-xl border-2 ${
                      msg.direction === 'INBOUND' 
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200' 
                        : 'bg-gradient-to-r from-green-50 to-emerald-100 border-green-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <span className="text-lg">{msg.direction === 'INBOUND' ? '📱' : '🤖'}</span>
                        <span className={msg.direction === 'INBOUND' ? 'text-blue-900' : 'text-green-900'}>
                          {msg.user.phone}
                        </span>
                        {msg.intent && (
                          <span className="px-2 py-1 text-xs bg-white/60 rounded-lg font-medium text-gray-700">
                            {msg.intent}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-medium text-gray-600">
                        {format(new Date(msg.createdAt), 'PPp')}
                      </div>
                    </div>
                    <div className="text-gray-900 font-medium">{msg.body}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              {deal.auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No audit logs yet</p>
                </div>
              ) : (
                deal.auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all">
                    <div className="text-xs font-medium text-gray-500 w-40 flex-shrink-0 bg-gray-100 px-3 py-2 rounded-lg">
                      {format(new Date(log.createdAt), 'PPp')}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900 mb-1">{log.action}</div>
                      <div className="text-xs text-gray-600 mb-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
                          {log.actorType}
                        </span>
                      </div>
                      {Object.keys(log.payload || {}).length > 0 && (
                        <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto font-mono">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'dispute' && deal.dispute && (
            <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg shadow-red-500/30">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-red-900">Dispute Details</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl">
                  <span className="text-sm font-semibold text-gray-700">Status:</span>
                  <span className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg font-bold text-sm border border-red-300">
                    {deal.dispute.status}
                  </span>
                </div>
                {deal.dispute.reason && (
                  <div className="p-4 bg-white rounded-xl">
                    <span className="text-sm font-semibold text-gray-700 block mb-2">Reason:</span>
                    <p className="text-sm text-gray-900 font-medium leading-relaxed">{deal.dispute.reason}</p>
                  </div>
                )}
                {deal.dispute.resolution && (
                  <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-bold text-green-800">Resolution:</span>
                    </div>
                    <p className="text-sm font-semibold text-green-900 leading-relaxed">
                      {deal.dispute.resolution}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between p-4 bg-white rounded-xl">
                  <span className="text-sm font-semibold text-gray-700">Opened:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(deal.dispute.createdAt), 'PPp')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

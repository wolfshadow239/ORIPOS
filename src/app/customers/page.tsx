
'use client';

import { useMemo, useState } from 'react';
import Shell from '@/components/Shell';
import { useApp } from '@/components/Providers';
import { useData } from '@/components/hooks';
import { Card, CardTitle, Badge, Btn, Input, Modal, Empty, Td, Th, Loading } from '@/components/ui';
import { HBars } from '@/components/charts';
import { addCustomer } from '@/lib/actions';
import { inr, compactINR, fmtDate } from '@/lib/format';
import { Search, UserPlus, Crown, Users } from 'lucide-react';

const DAY = 86400000;

function tier(spent: number): { name: string; color: string } {
  if (spent >= 200000) return { name: 'Platinum', color: 'dark' };
  if (spent >= 75000) return { name: 'Gold', color: 'amber' };
  if (spent >= 25000) return { name: 'Silver', color: 'slate' };
  return { name: 'Member', color: 'blue' };
}

function CustomersInner() {
  const { storeId } = useApp();
  const data = useData();
  const [q, setQ] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const rows = useMemo(() => {
    if (!data) return [];
    const query = q.trim().toLowerCase();
    return data.customers
      .filter(c => c.storeId === storeId)
      .map(c => {
        let spent = 0, visits = 0, last = 0;
        for (const o of data.orders) {
          if (o.customerId !== c.id || o.status !== 'completed') continue;
          spent += o.total;
          visits += 1;
          last = Math.max(last, o.createdAt);
        }
        return { ...c, spent, visits, last };
      })
      .filter(c => !query || c.name.toLowerCase().includes(query) || c.phone.includes(query))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 100);
  }, [data, q, storeId]);

  if (!data) return <Loading />;
  const top10 = rows.slice(0, 10).map(r => ({ name: r.name.split(' ')[0], spent: r.spent }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2" pad={false}>
          <div className="p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search customers…" className="pl-9" />
            </div>
            <div className="flex-1" />
            <Btn onClick={() => setAddOpen(true)}><UserPlus size={15} /> New customer</Btn>
          </div>
          {rows.length === 0 ? (
            <Empty icon={<Users size={22} />} title="No customers found" body="Add your first loyalty customer." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr><Th>Customer</Th><Th>Phone</Th><Th className="text-right">Visits</Th><Th className="text-right">Lifetime spend</Th><Th>Tier</Th><Th className="text-right">Points</Th><Th>Last visit</Th></tr>
                </thead>
                <tbody>
                  {rows.map(c => {
                    const t = tier(c.spent);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/60">
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-accent text-white text-xs font-bold flex items-center justify-center">
                              {c.name.split(' ').map(x => x[0]).join('').slice(0, 2)}
                            </div>
                            <span className="font-medium text-slate-800">{c.name}</span>
                          </div>
                        </Td>
                        <Td className="text-slate-500">{c.phone}</Td>
                        <Td className="text-right">{c.visits}</Td>
                        <Td className="text-right font-semibold text-ink">{inr(c.spent)}</Td>
                        <Td><Badge color={t.color}>{t.name}</Badge></Td>
                        <Td className="text-right font-semibold text-violet-600">{c.points}</Td>
                        <Td className="text-slate-500">{c.last ? fmtDate(c.last) : '—'}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle right={<Crown size={16} className="text-amber-500" />}>Top customers · lifetime</CardTitle>
            <HBars data={top10} yKey="name" xKey="spent" height={300} />
          </Card>
          <Card>
            <CardTitle>Loyalty tiers</CardTitle>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">🥉 Member</span><span className="text-slate-400">under ₹25,000</span></div>
              <div className="flex justify-between"><span className="text-slate-600">🥈 Silver</span><span className="text-slate-400">₹25,000+</span></div>
              <div className="flex justify-between"><span className="text-slate-600">🥇 Gold</span><span className="text-slate-400">₹75,000+</span></div>
              <div className="flex justify-between"><span className="text-slate-600">💎 Platinum</span><span className="text-slate-400">₹2,00,000+</span></div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">1 point per ₹100 spent · redeemable across all 9 Orison stores.</p>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New loyalty customer"
        footer={
          <>
            <Btn variant="outline" onClick={() => setAddOpen(false)}>Cancel</Btn>
            <Btn onClick={() => {
              if (!name.trim()) return;
              addCustomer(name.trim(), phone.trim() || '+91 ', storeId);
              setAddOpen(false);
              setName('');
              setPhone('');
            }}>Save customer</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500">FULL NAME</label>
            <Input className="mt-1.5" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ananya Iyer" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">PHONE</label>
            <Input className="mt-1.5" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98XXX XXXXX" />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Shell title="Customers" subtitle="Loyalty profiles, lifetime value and visit behaviour.">
      <CustomersInner />
    </Shell>
  );
}

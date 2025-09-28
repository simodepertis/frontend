"use client";

import contacts from "@/config/siteContacts.json";
import { useMemo } from "react";

type ContactItem = {
  name: string;
  languages?: string[];
  role?: string;
  notes?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
};

function buildMailto(email?: string) {
  if (!email) return undefined;
  return `mailto:${email}`;
}

function buildTel(phone?: string) {
  if (!phone) return undefined;
  return `tel:${phone.replace(/\s+/g, "")}`;
}

function buildWhatsAppLink(whatsapp?: string) {
  if (!whatsapp) return undefined;
  const v = whatsapp.trim();
  if (v.startsWith("http")) return v;
  const digits = v.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}`;
}

function buildTelegramLink(telegram?: string) {
  if (!telegram) return undefined;
  const v = telegram.trim();
  if (v.startsWith("http")) return v;
  const handle = v.replace(/^@/, "");
  return `https://t.me/${handle}`;
}

export default function ContattiPage() {
  const sections = useMemo(() => contacts.sections || [], []);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Contatti</h1>

      {sections.map((sec: any) => (
        <section key={sec.key} className="mb-10">
          <h2 className="text-2xl font-semibold text-white mb-4">{sec.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(sec.items || []).map((item: ContactItem, idx: number) => {
              const mail = buildMailto(item.email);
              const tel = buildTel(item.phone);
              const wa = buildWhatsAppLink(item.whatsapp);
              const tg = buildTelegramLink(item.telegram);
              return (
                <div key={`${sec.key}-${idx}`} className="rounded-xl border border-gray-700 bg-gray-800 p-5 flex flex-col">
                  <div>
                    <div className="text-xl font-bold text-white">{item.name}</div>
                    {item.languages?.length ? (
                      <div className="text-sm text-gray-300 mt-1">{item.languages.join(", ")}</div>
                    ) : null}
                    {item.notes ? (
                      <div className="text-sm text-gray-400 mt-2 whitespace-pre-line">{item.notes}</div>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-2 text-gray-200 text-sm">
                    {tel && (
                      <div className="flex items-center justify-between">
                        <span>Telefono</span>
                        <a className="text-blue-400 hover:underline" href={tel}>{item.phone}</a>
                      </div>
                    )}
                    {item.email && (
                      <div className="flex items-center justify-between">
                        <span>E-mail</span>
                        <a className="text-blue-400 hover:underline" href={mail}>{item.email}</a>
                      </div>
                    )}
                    {item.whatsapp && (
                      <div className="flex items-center justify-between">
                        <span>Whatsapp</span>
                        <a className="text-blue-400 hover:underline" href={wa} target="_blank" rel="noreferrer">{item.whatsapp}</a>
                      </div>
                    )}
                    {item.telegram && (
                      <div className="flex items-center justify-between">
                        <span>Telegram</span>
                        <a className="text-blue-400 hover:underline" href={tg} target="_blank" rel="noreferrer">{item.telegram}</a>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="mt-6">
                    {/* Priorità: WhatsApp > Email > Telegram > Telefono */}
                    {wa ? (
                      <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-full rounded-md border border-blue-400 text-blue-400 hover:bg-blue-500/10 py-2 font-medium">Inviami un messaggio</a>
                    ) : mail ? (
                      <a href={mail} className="inline-flex items-center justify-center w-full rounded-md border border-blue-400 text-blue-400 hover:bg-blue-500/10 py-2 font-medium">Inviami un messaggio</a>
                    ) : tg ? (
                      <a href={tg} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-full rounded-md border border-blue-400 text-blue-400 hover:bg-blue-500/10 py-2 font-medium">Inviami un messaggio</a>
                    ) : tel ? (
                      <a href={tel} className="inline-flex items-center justify-center w-full rounded-md border border-blue-400 text-blue-400 hover:bg-blue-500/10 py-2 font-medium">Chiama ora</a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}


"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

type UserShape = {
  name: string;
  email: string;
  role?: string;
  isModel?: boolean;
};

export default function ProfilePage() {
  const [tab, setTab] = useState("utente");
  const [user, setUser] = useState<UserShape | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
    if (jwt) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/user/profile`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setUser(data);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="text-center py-10 text-white">Caricamento...</div>;
  if (!user) return <div className="text-center py-10 text-red-400">Non autenticato.</div>;

  return (
    <main className="max-w-3xl mx-auto w-full px-2 py-10">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">Profilo</h1>
      <Tabs value={tab} onValueChange={setTab} className="mb-8 w-full">
        <TabsList className="w-full flex justify-center">
          <TabsTrigger value="utente" className="flex-1">Profilo Utente</TabsTrigger>
          {user.role === "modella" || user.isModel ? (
            <TabsTrigger value="modella" className="flex-1">Profilo Modella</TabsTrigger>
          ) : null}
        </TabsList>
        <TabsContent value="utente">
          <div className="bg-gray-800 border border-gray-600 rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Dati personali</h2>
            <div className="mb-2 text-white"><b>Nome:</b> {user.name}</div>
            <div className="mb-2 text-white"><b>Email:</b> {user.email}</div>
            {/* Qui puoi aggiungere la modifica dei dati utente */}
            <Sheet>
              <SheetTrigger asChild>
                <Button className="mt-4">Modifica dati</Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Modifica dati utente</SheetTitle>
                  <SheetDescription>
                    Qui puoi modificare i tuoi dati personali. (Demo: nessuna azione reale)
                  </SheetDescription>
                </SheetHeader>
                <form className="flex flex-col gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">Nome</label>
                    <Input type="text" defaultValue={user.name} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white">Email</label>
                    <Input type="email" defaultValue={user.email} />
                  </div>
                  <div className="flex gap-2 justify-end mt-6">
                    <Button type="button" variant="outline" onClick={() => document.activeElement && (document.activeElement as HTMLElement).blur()}>Chiudi</Button>
                    <Button type="submit">Salva</Button>
                  </div>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </TabsContent>
        {(user.role === "modella" || user.isModel) && (
          <TabsContent value="modella">
            <div className="bg-gray-800 border border-gray-600 rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Profilo Modella</h2>
              {/* Qui puoi aggiungere la gestione del profilo modella, foto, descrizione, ecc. */}
              <div className="mb-2 text-white"><b>Nome:</b> {user.name}</div>
              <div className="mb-2 text-white"><b>Email:</b> {user.email}</div>
              {/* Placeholder per gestione foto */}
              <div className="mt-4">
                <h3 className="font-semibold mb-2 text-white">Le tue foto</h3>
                <div className="flex gap-2 flex-wrap">
                  {/* Qui andranno le foto caricate */}
                  <div className="w-24 h-24 bg-gray-700 rounded flex items-center justify-center text-gray-400">Nessuna foto</div>
                </div>
                <Button className="mt-4">Aggiungi foto</Button>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="mt-6">Modifica profilo modella</Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Modifica profilo modella</SheetTitle>
                    <SheetDescription>
                      Qui puoi modificare i dati del profilo modella. (Demo: nessuna azione reale)
                    </SheetDescription>
                  </SheetHeader>
                  <form className="flex flex-col gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">Nome</label>
                      <Input type="text" defaultValue={user.name} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">Email</label>
                      <Input type="email" defaultValue={user.email} />
                    </div>
                    <div className="flex gap-2 justify-end mt-6">
                      <Button type="button" variant="outline" onClick={() => document.activeElement && (document.activeElement as HTMLElement).blur()}>Chiudi</Button>
                      <Button type="submit">Salva</Button>
                    </div>
                  </form>
                </SheetContent>
              </Sheet>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </main>
  );
}

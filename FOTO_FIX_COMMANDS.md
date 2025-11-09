# COMANDI PER FIX FOTO

Dopo che completo le modifiche, lancia questi comandi:

```powershell
git add src/app/dashboard/verifica-foto/page.tsx
```

```powershell
git commit -m "FIX FOTO: approccio semplice come incontri-veloci"
```

```powershell
git push origin main
```

Poi:
1. Aspetta che Vercel finisca deploy (max 2 min)
2. Vai su https://frontend-ar9c.vercel.app/dashboard/verifica-foto
3. Hard refresh (Ctrl+Shift+R)
4. Carica 3 foto
5. Segna 1 come volto
6. Clicca "Invia a verifica"
7. Mandami screenshot di COSA dice l'alert DEBUG

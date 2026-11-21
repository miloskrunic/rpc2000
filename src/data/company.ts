export const company = {
  name: 'RPC2000',
  title: 'Obrada metala Valjevo: struganje i glodanje | RPC2000',
  location: 'Valjevo, Srbija',
  area: '2.500',
  phone: '+381 (0)XX XXX XXXX',
  email: 'kontakt@rpc2000.example',
  description:
    'Obrada metala u Valjevu. Struganje, glodanje, obaranje ivica i oblikovanje na presama, za pojedinačne komade i serije.',
} as const;

export const navigation = [
  { label: 'Usluge', href: `${import.meta.env.BASE_URL}#usluge` },
  { label: 'Naš pristup', href: `${import.meta.env.BASE_URL}#pristup` },
  { label: 'Prostor i oprema', href: `${import.meta.env.BASE_URL}#oprema` },
] as const;

export const services = [
  {
    id: 'struganje',
    number: '01',
    title: 'Struganje',
    description:
      'Obrada na strugu za pojedinačne delove i serije. Razgovarajmo o obliku, materijalu i zahtevima vašeg komada.',
    tag: 'POJEDINAČNO / SERIJSKI',
  },
  {
    id: 'glodanje',
    number: '02',
    title: 'Glodanje',
    description:
      'Uslužna obrada na glodalici prema potrebama vašeg posla. Pošaljite opis ili dokumentaciju da razmotrimo zahtev.',
    tag: 'OBRADA NA GLODALICI',
  },
  {
    id: 'obaranje-ivica',
    number: '03',
    title: 'Obaranje ivica',
    description:
      'Obaranje ivica metalnih delova. Dostupno kao zasebna usluga ili u sklopu drugih postupaka obrade.',
    tag: 'ZAVRŠNA OBRADA IVICA',
  },
  {
    id: 'oblikovanje',
    number: '04',
    title: 'Oblikovanje na presama',
    description:
      'Oblikovanje metalnih komada na presama. Mogućnost izrade i obim posla razmatramo prema konkretnom zahtevu.',
    tag: 'DVE PRESE U POGONU',
  },
] as const;

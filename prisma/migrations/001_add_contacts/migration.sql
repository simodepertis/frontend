-- CreateTable
CREATE TABLE "SiteContact" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "telegram" TEXT,
    "languages" TEXT[],
    "role" TEXT,
    "notes" TEXT,
    "sectionKey" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContact_pkey" PRIMARY KEY ("id")
);

-- Insert default contacts
INSERT INTO "SiteContact" ("name", "email", "phone", "whatsapp", "languages", "sectionKey", "sectionTitle") VALUES
('Francesco', 'francesco@incontriescort.org', '+41 32 580 08 93', '+41 762031758', ARRAY['Italian', 'English', 'Hungarian'], 'annunci', 'Contatti per annunci'),
('Marco', 'marco@incontriescort.org', NULL, NULL, ARRAY['English'], 'annunci', 'Contatti per annunci'),
('Contatto per forum', 'forum@incontriescort.org', NULL, NULL, ARRAY['Italian', 'English'], 'altri-problemi', 'Contattare per altri problemi'),
('Contatti per utenti, recensioni, commenti e altro', 'info@incontriescort.org', NULL, NULL, ARRAY['Italian', 'English'], 'altri-problemi', 'Contattare per altri problemi'),
('Contatto per problemi non risolti o lamentele', 'support@incontriescort.org', NULL, NULL, ARRAY['Italian', 'English'], 'altri-problemi', 'Contattare per altri problemi');

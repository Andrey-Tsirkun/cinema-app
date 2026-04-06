-- AlterTable
ALTER TABLE "User" ADD COLUMN     "oauthProvider" TEXT,
ADD COLUMN     "oauthSubject" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_oauthProvider_oauthSubject_key" ON "User"("oauthProvider", "oauthSubject");

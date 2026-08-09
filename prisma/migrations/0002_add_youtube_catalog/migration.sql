-- AlterTable
ALTER TABLE "cached_tracks" ADD COLUMN "videoId" TEXT;

-- CreateTable
CREATE TABLE "youtube_videos" (
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artistName" TEXT NOT NULL DEFAULT '',
    "duration" INTEGER NOT NULL DEFAULT 0,
    "thumbnail" TEXT,
    "channelId" TEXT,
    "channelTitle" TEXT,
    "embeddable" BOOLEAN NOT NULL DEFAULT true,
    "subgenre" TEXT,
    "source" TEXT NOT NULL DEFAULT 'search',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "youtube_videos_pkey" PRIMARY KEY ("videoId")
);

-- CreateTable
CREATE TABLE "youtube_video_mappings" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "songKey" TEXT NOT NULL,
    "artistKey" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "youtube_video_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube_quota" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "date" TEXT NOT NULL,
    "unitsUsed" INTEGER NOT NULL DEFAULT 0,
    "searches" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "youtube_quota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "youtube_videos_subgenre_idx" ON "youtube_videos"("subgenre");

-- CreateIndex
CREATE INDEX "youtube_videos_artistName_idx" ON "youtube_videos"("artistName");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_video_mappings_songKey_artistKey_key" ON "youtube_video_mappings"("songKey", "artistKey");

-- CreateIndex
CREATE INDEX "youtube_video_mappings_videoId_idx" ON "youtube_video_mappings"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_quota_date_key" ON "youtube_quota"("date");

-- AddForeignKey
ALTER TABLE "youtube_video_mappings" ADD CONSTRAINT "youtube_video_mappings_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "youtube_videos"("videoId") ON DELETE CASCADE ON UPDATE CASCADE;

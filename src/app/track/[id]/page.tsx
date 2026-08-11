import type { Metadata } from "next";

import Image from "next/image";
import Link from "next/link";

import { ArrowLeft, Clock, Download, Music2, Radio } from "lucide-react";

import { fetchTrack } from "@/lib/catalog";
import { site } from "@/content/site";

import { PublicPlayButton } from "@/components/track/public-play-button";
import { ShareTrackButton } from "@/components/track/share-track-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { canDownloadTrack, formatDuration, formatNumber, trackDownloadHref } from "@/lib/utils";
import { notFound } from "next/navigation";

interface TrackPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
  const { id } = await params;
  const track = await fetchTrack(id);
  if (!track) {
    return { title: "Track not found" };
  }

  const title = `${track.name} — ${track.artistName}`;
  const description = `Listen to “${track.name}” by ${track.artistName} on Phonq — free, legal, Creative Commons streaming.`;

  return {
    title,
    description,
    openGraph: {
      type: "music.song",
      siteName: site.name,
      title,
      description,
      url: `${site.url}/track/${track.id}`,
      images: track.image ? [{ url: track.image, alt: `${track.name} cover` }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: track.image ? [track.image] : undefined,
    },
  };
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { id } = await params;
  const track = await fetchTrack(id);
  if (!track) notFound();

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-10 sm:px-6 lg:py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Phonq
      </Link>

      <Card className="overflow-hidden">
        <div className="grid gap-0 sm:grid-cols-[280px_1fr]">
          <div className="relative aspect-square bg-muted">
            {track.image ? (
              <Image
                src={track.image}
                alt={`${track.name} cover`}
                fill
                sizes="(min-width: 640px) 280px, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <span className="flex size-full items-center justify-center">
                <Music2 className="size-16 text-muted-foreground/40" />
              </span>
            )}
          </div>

          <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                {track.genre ?? "phonk"}
              </Badge>
              {track.bpm ? (
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  {track.bpm} BPM
                </Badge>
              ) : null}
            </div>

            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                {track.name}
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">{track.artistName}</p>
              <p className="text-sm text-muted-foreground">{track.albumName}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" /> {formatDuration(track.duration)}
              </span>
              {track.listensTotal > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Radio className="size-4" /> {formatNumber(track.listensTotal)} streams
                </span>
              ) : null}
              {track.licenseName ? <span>{track.licenseName}</span> : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <PublicPlayButton track={track} />
              {canDownloadTrack(track) && (
                <a
                  href={trackDownloadHref(track)!}
                  target={track.source === "youtube" ? undefined : "_blank"}
                  rel={track.source === "youtube" ? undefined : "noreferrer"}
                  download
                >
                  <Badge variant="outline" className="h-10 gap-1.5 px-4">
                    <Download className="size-4" /> Download
                  </Badge>
                </a>
              )}
              <ShareTrackButton title={`${track.name} — ${track.artistName}`} image={track.image} />
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Free, legal, full-length streaming. Creative Commons licensed by the artist — no ads, no
          paywalls, no previews.
        </p>
        <Link
          href={`/embed/${track.id}`}
          className="text-sm text-primary underline underline-offset-2"
          target="_blank"
        >
          Embed this track
        </Link>
      </div>
    </div>
  );
}

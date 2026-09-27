type OgImageProfileProps = {
  username: string;
  avatarUrl: string;
  years: number;
  status: string;
};

export function OgImageProfile({
  username,
  years,
  avatarUrl,
  status = 'A little trip down memory lane',
}: OgImageProfileProps) {
  return (
    <div class="og-profile">
      <div class="og-profile__watermark">{years}</div>

      <div class="og-content">
        <div class="og-status">{status}</div>

        <div class="og-profile__years">{years}</div>

        <div class="og-profile__years-label">
          <strong>years</strong> on GitHub
        </div>

        <div class="og-profile__user">
          <div class="og-avatar">
            <img class="og-avatar__image" src={avatarUrl} alt="" />
          </div>

          <div class="og-profile__username">@{username}</div>
        </div>
      </div>

      <div class="og-spark og-spark--green"></div>
      <div class="og-spark og-spark--purple"></div>
      <div class="og-spark og-spark--orange"></div>

      <div class="og-dot og-dot--purple"></div>
      <div class="og-dot og-dot--green"></div>
      <div class="og-dot og-dot--orange"></div>
    </div>
  );
}

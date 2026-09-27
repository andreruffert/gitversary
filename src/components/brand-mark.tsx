export function BrandMark(props) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      aria-hidden="true"
      style={{ border: '1px solid var(--color-border)', borderRadius: '.38rem' }}
      {...props}
    >
      <rect width="512" height="512" rx="120" fill="var(--color-bg)" />
      <rect width="512" height="512" rx="120" fill="url(#paint0_radial_36_2)" />
      <rect width="512" height="512" rx="120" fill="url(#pattern0_36_2)" fill-opacity="0.2" />
      {/* <rect x="4" y="4" width="504" height="504" rx="116" stroke="var(--color-border)" stroke-width="8"/> */}
      <path
        d="M256 60.95C145.5 60.95 56 150.5 56 260.95C56 349.333 113.3 424.283 192.75 450.7C202.75 452.583 206.417 446.4 206.417 441.083C206.417 436.333 206.25 423.75 206.167 407.083C150.533 419.15 138.8 380.25 138.8 380.25C129.7 357.167 116.55 351 116.55 351C98.4333 338.6 117.95 338.85 117.95 338.85C138.033 340.25 148.583 359.45 148.583 359.45C166.417 390.033 195.4 381.2 206.833 376.083C208.633 363.15 213.783 354.333 219.5 349.333C175.083 344.333 128.4 327.133 128.4 250.5C128.4 228.667 136.15 210.833 148.983 196.833C146.733 191.783 139.983 171.45 150.733 143.9C150.733 143.9 167.483 138.533 205.733 164.4C221.733 159.95 238.733 157.75 255.733 157.65C272.733 157.75 289.733 159.95 305.733 164.4C343.733 138.533 360.483 143.9 360.483 143.9C371.233 171.45 364.483 191.783 362.483 196.833C375.233 210.833 382.983 228.667 382.983 250.5C382.983 327.333 336.233 344.25 291.733 349.167C298.733 355.167 305.233 367.433 305.233 386.167C305.233 412.933 304.983 434.433 304.983 440.933C304.983 446.183 308.483 452.433 318.733 450.433C398.75 424.2 456 349.2 456 260.95C456 150.5 366.45 60.95 256 60.95Z"
        fill="var(--color-text)"
      />
      <defs>
        <radialGradient
          id="paint0_radial_36_2"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(452.5 45.5) rotate(135.494) scale(614.852)"
        >
          <stop stopColor="var(--color-green)" stopOpacity="0.5" />
          <stop offset="0.306396" stopColor="var(--color-green)" stopOpacity="0" />
          <stop offset="0.734144" stopColor="var(--color-purple)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--color-purple)" stopOpacity="0.5" />
        </radialGradient>
        <pattern
          id="pattern0_36_2"
          patternUnits="userSpaceOnUse"
          patternTransform="matrix(37 0 0 36 237 237.5)"
          preserveAspectRatio="none"
          viewBox="-0.5 -0.5 37 36"
          width="1"
          height="1"
        >
          <use xlinkHref="#pattern0_36_2_inner" transform="translate(-37 -36)" />
          <use xlinkHref="#pattern0_36_2_inner" transform="translate(0 -36)" />
          <use xlinkHref="#pattern0_36_2_inner" transform="translate(-37 0)" />
          <g id="pattern0_36_2_inner">
            <rect
              width="37"
              height="36"
              transform="matrix(-1 0 0 1 37 0)"
              stroke="var(--color-text)"
            />
          </g>
        </pattern>
      </defs>
    </svg>
  );
}

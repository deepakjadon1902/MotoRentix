type GoogleButtonProps = {
  href: string;
  disabled?: boolean;
};

const GoogleButton = ({ href, disabled }: GoogleButtonProps) => (
  <button
    type="button"
    onClick={() => {
      if (!disabled) {
        window.location.assign(href);
      }
    }}
    disabled={disabled}
    className="w-full h-10 rounded border border-[#dadce0] bg-white text-[#3c4043] shadow-[0_1px_2px_rgba(60,64,67,0.15)] transition hover:shadow-[0_2px_4px_rgba(60,64,67,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
    style={{ fontFamily: "'Roboto', 'Arial', sans-serif", fontWeight: 500, fontSize: "14px" }}
    aria-label="Continue with Google"
  >
    <span className="flex items-center justify-center gap-3">
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.72 1.22 9.22 3.22l6.84-6.84C35.86 2.34 30.24 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.42 13 17.77 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.5 24.5c0-1.64-.15-3.22-.43-4.75H24v9h12.78c-.55 2.97-2.22 5.5-4.75 7.2l7.6 5.88C43.76 37.52 46.5 31.52 46.5 24.5z"
        />
        <path
          fill="#FBBC05"
          d="M10.54 28.92c-.5-1.5-.78-3.1-.78-4.92s.28-3.42.78-4.92l-7.98-6.2C.92 16.1 0 19.93 0 24s.92 7.9 2.56 11.12l7.98-6.2z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.24 0 11.86-2.06 15.82-5.62l-7.6-5.88c-2.1 1.42-4.78 2.26-8.22 2.26-6.23 0-11.58-3.5-13.46-8.58l-7.98 6.2C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      <span>Continue with Google</span>
    </span>
  </button>
);

export default GoogleButton;

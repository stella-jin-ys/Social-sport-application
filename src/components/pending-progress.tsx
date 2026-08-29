type PendingProgressProps = {
  active: boolean;
  label: string;
};

export function PendingProgress({ active, label }: PendingProgressProps) {
  if (!active) {
    return null;
  }

  return (
    <div aria-label={label} className="pending-progress" role="progressbar">
      <span className="pending-progress__bar" />
    </div>
  );
}

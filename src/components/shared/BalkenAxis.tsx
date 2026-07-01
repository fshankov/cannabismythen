/**
 * BalkenAxis — five dotted vertical guides (0 / 25 / 50 / 75 / 100 %)
 * behind a Balken bar or Spannweite stem. The 50 % tick uses a
 * slightly stronger stroke colour to anchor "above/below half"
 * comparisons.
 *
 * Same class names as `cannabismythen/.../grid/BalkenBar.tsx`
 * (`.carm-balken__axis` + `.carm-balken__axis-tick[data-pos]`) so the
 * CSS port-back is a 1:1 swap of token colours.
 */
export default function BalkenAxis() {
  return (
    <div className="carm-balken__axis" aria-hidden="true">
      <span className="carm-balken__axis-tick" data-pos="0" />
      <span className="carm-balken__axis-tick" data-pos="25" />
      <span
        className="carm-balken__axis-tick"
        data-pos="50"
        data-emphasis="mid"
      />
      <span className="carm-balken__axis-tick" data-pos="75" />
      <span className="carm-balken__axis-tick" data-pos="100" />
    </div>
  );
}

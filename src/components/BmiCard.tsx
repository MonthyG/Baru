import { bmi, bmiCategory } from "../wellness";
import { fmt } from "../domain";
export function BmiCard({
  weight,
  height,
  age,
}: {
  weight: number | null | undefined;
  height: number | null;
  age: number | null;
}) {
  const value = bmi(weight, height);
  return (
    <section className="card bmi-card">
      <div className="section-title">
        <h2>Your BMI</h2>
        <span className="badge neutral">Weight ÷ height²</span>
      </div>
      <div className="bmi-reading">
        <strong>{value === null ? "—" : fmt(value)}</strong>
        <span>{bmiCategory(value, age)}</span>
      </div>
      {value !== null && age !== null && age >= 20 && (
        <>
          <div className="bmi-scale">
            <span />
            <span />
            <span />
            <span />
            <i
              style={{
                left: `${Math.max(0, Math.min(100, ((value - 15) / 25) * 100))}%`,
              }}
            />
          </div>
          <div className="bmi-labels">
            <span>18.5</span>
            <span>25</span>
            <span>30</span>
          </div>
        </>
      )}
      <p className="help muted">
        {age !== null && age < 20
          ? "Adult BMI categories do not apply below age 20. Teen interpretation requires BMI-for-age percentiles."
          : "BMI is a screening measure, not a diagnosis or a measure of muscle versus body fat."}{" "}
        <a
          href="https://www.cdc.gov/bmi/adult-calculator/index.html"
          target="_blank"
          rel="noreferrer"
        >
          About BMI ↗
        </a>
      </p>
    </section>
  );
}

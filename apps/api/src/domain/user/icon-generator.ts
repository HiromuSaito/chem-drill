export interface IconGeneratorInput {
  color: string;
  element: string;
  style: "cute" | "cool" | "simple" | "science";
}

export interface IconGenerator {
  generate(input: IconGeneratorInput): Promise<Buffer>;
}

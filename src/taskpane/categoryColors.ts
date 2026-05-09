export const categoryColors = [
  { value: "preset0", label: "Red", swatch: "#d13438" },
  { value: "preset1", label: "Orange", swatch: "#f7630c" },
  { value: "preset2", label: "Brown", swatch: "#8e562e" },
  { value: "preset3", label: "Yellow", swatch: "#fce100" },
  { value: "preset4", label: "Green", swatch: "#13a10e" },
  { value: "preset5", label: "Teal", swatch: "#00b7c3" },
  { value: "preset6", label: "Olive", swatch: "#498205" },
  { value: "preset7", label: "Blue", swatch: "#0078d4" },
  { value: "preset8", label: "Purple", swatch: "#881798" },
  { value: "preset9", label: "Cranberry", swatch: "#c239b3" },
  { value: "preset10", label: "Steel", swatch: "#5c5c5c" },
  { value: "preset11", label: "Dark red", swatch: "#750b1c" },
  { value: "preset12", label: "Dark orange", swatch: "#da3b01" },
  { value: "preset13", label: "Dark brown", swatch: "#4d291c" },
  { value: "preset14", label: "Dark yellow", swatch: "#986f0b" },
  { value: "preset15", label: "Dark green", swatch: "#0b6a0b" },
  { value: "preset16", label: "Dark teal", swatch: "#00666d" },
  { value: "preset17", label: "Dark olive", swatch: "#394146" },
  { value: "preset18", label: "Dark blue", swatch: "#004e8c" },
  { value: "preset19", label: "Dark purple", swatch: "#5c126b" },
  { value: "preset20", label: "Dark cranberry", swatch: "#80215d" },
  { value: "preset21", label: "Gray", swatch: "#8a8886" },
  { value: "preset22", label: "Light gray", swatch: "#c8c6c4" },
  { value: "preset23", label: "Black", swatch: "#201f1e" },
  { value: "preset24", label: "Dark gray", swatch: "#3b3a39" }
];

export function getColorMeta(color: string) {
  return categoryColors.find((entry) => entry.value === color) ?? {
    value: color,
    label: color || "Unknown color",
    swatch: "#8a8886"
  };
}

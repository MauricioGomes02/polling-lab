import { appendFile, access } from "node:fs/promises";
import { constants } from "node:fs";

interface Temperature {
  city: string;
  value: number;
  measuredAt: Date;
}

interface TemperatureSource {
  getTemperature(): Promise<Temperature>;
}

interface TemperaturePersistence {
  save(temperature: Temperature): Promise<void>;
}

export class OpenMeteoTemperatureSource implements TemperatureSource {
  constructor(private readonly uri: string) {}

  async getTemperature(): Promise<Temperature> {
    const response = await fetch(this.uri);

    if (!response.ok) {
      throw new Error("Não foi possível obter as informações sobre o tempo");
    }

    const json = await response.json() as { current: { temperature_2m: number } };

    return {
      city: "Canoas",
      value: json.current.temperature_2m,
      measuredAt: new Date()
    };
  }
}

export class CsvTemperaturePersistence implements TemperaturePersistence {
  constructor(private readonly file: string) {}

  async save(temperature: Temperature): Promise<void> {
    const date = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "medium"
    }).format(temperature.measuredAt).replace(", ", " ");
    const line = `${date},${temperature.city},${temperature.value}\n`;

    try {
      await access(this.file, constants.F_OK);
      await appendFile(this.file, line);
    } catch {
      await appendFile(this.file, `data,cidade,temperatura\n${line}`);
    }
  }
}

export class TemperaturePolling {
  constructor(
    private readonly source: TemperatureSource,
    private readonly persistence: TemperaturePersistence,
    private readonly interval: number
  ) {}

  async execute(): Promise<void> {
    try {
      const temperature = await this.source.getTemperature();
      await this.persistence.save(temperature);
      console.log(`Em ${temperature.city}, a temperatura atual é de ${temperature.value}°C`);
    } catch (error) {
      if (error instanceof Error && error.message === "Não foi possível obter as informações sobre o tempo") {
        console.log(error.message);
      } else {
        console.log("Ocorreu um erro ao tentar obter informações sobre o tempo");
      }
    }
  }

  start(): void {
    void this.execute().finally(() => {
      setTimeout(() => {
        this.start();
      }, this.interval);
    });
  }
}

export function main(): void {
  const uri = "https://api.open-meteo.com/v1/forecast?latitude=-29.9178&longitude=-51.1836&current=temperature_2m";
  const source = new OpenMeteoTemperatureSource(uri);
  const persistence = new CsvTemperaturePersistence("temperaturas.csv");
  const polling = new TemperaturePolling(source, persistence, 10000);

  polling.start();
}

if (require.main === module) {
  main();
}

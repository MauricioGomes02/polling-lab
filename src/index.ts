import { appendFile, access } from "node:fs/promises";
import { constants } from "node:fs";

function main(): void {
  const uri = "https://api.open-meteo.com/v1/forecast?latitude=-29.9178&longitude=-51.1836&current=temperature_2m";

  try {
    fetch(uri)
      .then(response => {
        if (!response.ok) {
          console.log("Não foi possível obter as informações sobre o tempo");
        } else {
          response
            .json()
            .then(json => {
              const file = "temperaturas.csv";
              const date = new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "medium"
              }).format(new Date()).replace(", ", " ");
              access(file, constants.F_OK)
                .then(() => appendFile(file, `${date},Canoas,${json.current.temperature_2m}\n`))
                .catch(() => appendFile(file, `data,cidade,temperatura\n${date},Canoas,${json.current.temperature_2m}\n`));
              console.log(`Em Canoas, a temperatura atual é de ${json.current.temperature_2m}°C`);
            });
        }
      });
  } catch (error) {
    console.log("Ocorreu um erro ao tentar obter informações sobre o tempo");
  }
  finally {
    setTimeout(() => {
      main();
    }, 10000);
  }
}

main();

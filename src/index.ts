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

import './style.css';
import { fromUnixTime, intlFormat } from 'date-fns';
import toggleBtn from './modules/theme-toggle';
import dom from './modules/dom';
import { DateTime } from 'luxon';

export interface CityDetails {
  cityName: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
}

interface CurrentWeatherDetails {
  date: string;
  time: string;
  currentTemp: string;
  feelsLikeTemp: string;
  humidity: string;
  pressure: string;
  sunrise: string;
  sunset: string;
  visibility: string;
  windSpeed: string;
  weatherDescription: string;
  weatherIcon: string;
  weatherID: number;
}

interface ForecastDetails {
  date: string;
  time: string;
  temp: string;
  weather: string;
  icon: string;
  weatherID: number;
}

const CreateCityDetailsObj = (cityDetails: CityDetails): CityDetails => {
  const cityName = cityDetails.cityName;
  const state = cityDetails.state;
  const country = cityDetails.country;
  const lat = cityDetails.lat;
  const lon = cityDetails.lon;

  return {
    cityName,
    state,
    country,
    lat,
    lon,
  };
};

const CreateCurrentWeatherDetailsObj = (weatherDetails: CurrentWeatherDetails): CurrentWeatherDetails => {
  const date = weatherDetails.date;
  const time = weatherDetails.time;
  const currentTemp = weatherDetails.currentTemp;
  const feelsLikeTemp = weatherDetails.feelsLikeTemp;
  const humidity = weatherDetails.humidity;
  const pressure = weatherDetails.pressure;
  const sunrise = weatherDetails.sunrise;
  const sunset = weatherDetails.sunset;
  const windSpeed = weatherDetails.windSpeed;
  const visibility = weatherDetails.visibility;
  const weatherDescription = weatherDetails.weatherDescription;
  const weatherIcon = weatherDetails.weatherIcon;
  const weatherID = weatherDetails.weatherID;

  return {
    date,
    time,
    currentTemp,
    feelsLikeTemp,
    humidity,
    pressure,
    sunrise,
    sunset,
    visibility,
    windSpeed,
    weatherDescription,
    weatherIcon,
    weatherID,
  };
};

const CreateForecastDetailsObj = (forecastDetails: ForecastDetails): ForecastDetails => {
  const date = forecastDetails.date;
  const time = forecastDetails.time;
  const temp = forecastDetails.temp;
  const weather = forecastDetails.weather;
  const icon = forecastDetails.icon;
  const weatherID = forecastDetails.weatherID;

  return {
    date,
    time,
    temp,
    weather,
    icon,
    weatherID,
  };
};

const getCityDetails = async (cityName: string, apiKey: string): Promise<CityDetails> => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${apiKey}`,
      { mode: 'cors' }
    );
    const citiesList = await response.json();
    const countryFullname = new Intl.DisplayNames(['en'], { type: 'region' });

    const cityDetails = CreateCityDetailsObj({
      cityName: citiesList[0].name,
      state: citiesList[0].state,
      country: countryFullname.of(citiesList[0].country),
      lat: citiesList[0].lat,
      lon: citiesList[0].lon,
    });

    return cityDetails;
  } catch (error) {
    throw new Error(error.message);
  }
};

const getCurrentWeather = async (cityName: string, apiKey: string, apiUnit: string
): Promise<CurrentWeatherDetails> => {
  const cityDetails = await getCityDetails(cityName, apiKey);
  const greenwichDetails = await getCityDetails('greenwich', apiKey);
  console.log(cityDetails); //!REMOVE LATER!

  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${cityDetails.lat}&lon=${cityDetails.lon}&units=${apiUnit}&appid=${apiKey}`, { mode: 'cors' });
    const currentWeatherInfo = await response.json();

    const currentWeatherDetails = CreateCurrentWeatherDetailsObj({
      date: getLocalDateTime(currentWeatherInfo.dt, currentWeatherInfo.timezone).localDate,
      time: getLocalDateTime(currentWeatherInfo.dt, currentWeatherInfo.timezone).localTime,
      currentTemp: formatTemp(Math.round(currentWeatherInfo.main.temp), apiUnit),
      feelsLikeTemp: formatTemp(Math.round(currentWeatherInfo.main.feels_like), apiUnit),
      humidity: `${currentWeatherInfo.main.humidity}%`,
      pressure: `${currentWeatherInfo.main.pressure}hPa`,
      sunrise: getLocalDateTime(currentWeatherInfo.sys.sunrise, currentWeatherInfo.timezone).localTime,
      sunset: getLocalDateTime(currentWeatherInfo.sys.sunset, currentWeatherInfo.timezone).localTime,
      visibility: `${currentWeatherInfo.visibility / 1000}km`,
      windSpeed: formatWindSpeed(currentWeatherInfo.wind.speed, apiUnit),
      weatherDescription: capitalizeWeatherDescription(currentWeatherInfo.weather[0].description),
      weatherIcon: currentWeatherInfo.weather[0].icon,
      weatherID: currentWeatherInfo.weather[0].id,
    });

    // console.log(currentWeatherInfo);
    console.log(currentWeatherDetails); //! REMOVE LATER!
    displayDetails(cityDetails, currentWeatherDetails);
    return currentWeatherDetails;
  } catch (error) {
    throw new Error(error.message);
  }
};

const getLocalDateTime = (timestamp: number, offset: number) => {
  // Convert timestamp to milliseconds
  const timestampInMilliseconds = timestamp * 1000;

  // Create a DateTime object from the timestamp
  const date = DateTime.fromMillis(timestampInMilliseconds);

  console.log(`UTC${offset >= 0 ? '+' : '-'}${offset / 3600}`);

  let offsetString: string;
  if (offset % 3600 === 0) {
    // If the offset is a whole hour, use the format "UTC+5" or "UTC-5"
    offsetString = `UTC${Math.sign(offset) === 1 ? '+' : '-'}${Math.abs(offset / 3600)}`;
  } else {
    // If the offset is not a whole hour, use the format "UTC+5:30" or "UTC-5:30"
    offsetString = `UTC${Math.sign(offset) === 1 ? '+' : '-'}${Math.floor(Math.abs(offset / 3600))}:${Math.round((Math.abs(offset / 3600) - Math.floor(Math.abs(offset / 3600))) * 60)}`;
  }

  // Adjust the time zone offset
  let time = date.setZone(offsetString).toString();
  console.log(time);

  if (time.length > 24) {
    time = time.slice(0, -6);
  } else if (time.length === 24) {
    time = time.slice(0, -1);
  }

  const localDate = intlFormat(new Date(time), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const localTime = intlFormat(new Date(time), {
    hour: 'numeric',
    minute: 'numeric',
  });

  return { localDate, localTime };
};

const getThreeDaysForecast = async (cityName: string, apiKey: string, apiUnit: string): Promise<ForecastDetails[]> => {
  const cityDetails = await getCityDetails(cityName, apiKey);

  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${cityDetails.lat}&lon=${cityDetails.lon}&units=${apiUnit}&cnt=24&appid=${apiKey}`, { mode: 'cors' });
    const forecastInfo = await response.json();

    const dateArray: string[] = [];
    const timeArray: string[] = [];
    const tempArray: string[] = [];
    const weatherArray: string[] = [];
    const iconArray: string[] = [];
    const weatherIDArray: number[] = [];

    // TODO: correct forecast date and time
    forecastInfo.list.forEach((forecast: any) => {
      dateArray.push(getDateAndTime(forecast.dt).date);
      timeArray.push(getDateAndTime(forecast.dt).time);
      tempArray.push(formatTemp(Math.round(forecast.main.temp), apiUnit));
      weatherArray.push(capitalizeWeatherDescription(forecast.weather[0].description));
      iconArray.push(forecast.weather[0].icon);
      weatherIDArray.push(forecast.weather[0].id);
    });

    const totalForecastList: ForecastDetails[] = [];

    for (let index = 0; index < 24; index += 1) {
      const forecastObject = CreateForecastDetailsObj({
        date: dateArray[index],
        time: timeArray[index],
        temp: tempArray[index],
        weather: weatherArray[index],
        icon: iconArray[index],
        weatherID: weatherIDArray[index],
      });

      totalForecastList.push(forecastObject);
    }

    console.log(totalForecastList); //! REMOVE LATER
    return totalForecastList;
  } catch (error) {
    throw new Error(error.message);
  }
};

const getDateAndTime = (unixTime: number) => {
  const date = intlFormat(fromUnixTime(unixTime), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const time = intlFormat(fromUnixTime(unixTime), {
    hour: 'numeric',
    minute: 'numeric',
  });

  return { date, time };
};

const formatTemp = (temp: number, apiUnit: string): string => {
  if (apiUnit === 'metric') {
    return `${temp}°C`;
  } else if (apiUnit === 'imperial') {
    return `${temp}°F`;
  }
};

const formatWindSpeed = (windSpeed: number, apiUnit: string): string => {
  if (apiUnit === 'metric') {
    return `${windSpeed}m/s`;
  } else if (apiUnit === 'imperial') {
    return `${windSpeed}mph`;
  }
};

const capitalizeWeatherDescription = (weatherDescription: string): string => weatherDescription.toLowerCase().split(' ').map((word) => word.charAt(0).toUpperCase() + word.substring(1)).join(' ');

const displayDetails = (cityDetails: CityDetails, currentWeatherDetails: CurrentWeatherDetails): void => {
  let regionName: string;
  if (cityDetails.state === undefined) {
    regionName = `${cityDetails.country}`;
  } else {
    regionName = `${cityDetails.state}, ${cityDetails.country}`;
  }

  const firstInfo = `
    <div>
      <h1 class="text-[1.6rem] leading-[1] font-semibold -ml-0.5 xs:text-[2rem] sm:text-[2.25rem] md:text-[3.2rem] md:-ml-1 lg:text-[3.75rem]">
        ${cityDetails.cityName}
      </h1>
      <p class="font-bebas text-sm tracking-wide text-neutral-600 xs:text-base sm:text-lg md:text-2xl lg:text-3xl dark:text-neutral-500">
        ${regionName}
      </p>
    </div>

    <div class="text-base sm:text-lg md:text-2xl">
      <p>
        ${currentWeatherDetails.date}
      </p>
      <p>
        ${currentWeatherDetails.time}
      </p>
      <p class="mt-4 font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl md:mt-6">
        ${currentWeatherDetails.currentTemp}
      </p>
    </div>
    `;

  dom.firstInfoContainer.innerHTML = firstInfo;
};

const runApp = (): void => {
  // TODO: clean up main function
  toggleBtn();

  const apiKey = '9095cc5220ce63f359ff2704300c35ba';
  let apiUnit: string;
  let cityName: string;

  if (localStorage.getItem('cityName')) {
    cityName = JSON.parse(localStorage.getItem('cityName'));
  } else {
    cityName = 'greenwich';
  }

  if (localStorage.getItem('unit')) {
    apiUnit = JSON.parse(localStorage.getItem('unit'));
    if (apiUnit === 'imperial') {
      dom.unitToggleBtn.checked = true;
    }
  } else {
    apiUnit = 'metric';
  }

  dom.unitToggleBtn.onclick = () => {
    if (apiUnit === 'metric') {
      apiUnit = 'imperial';
    } else if (apiUnit === 'imperial') {
      apiUnit = 'metric';
    }

    getCurrentWeather(cityName, apiKey, apiUnit);
    getThreeDaysForecast(cityName, apiKey, apiUnit);
    localStorage.setItem('unit', JSON.stringify(apiUnit));
  };

  getCurrentWeather(cityName, apiKey, apiUnit);
  getThreeDaysForecast(cityName, apiKey, apiUnit);

  dom.searchSubmitBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const cityName = dom.citySearch.value;
    localStorage.setItem('cityName', JSON.stringify(cityName));

    getCurrentWeather(cityName, apiKey, apiUnit);
    getThreeDaysForecast(cityName, apiKey, apiUnit);

    dom.unitToggleBtn.onclick = () => {
      if (apiUnit === 'metric') {
        apiUnit = 'imperial';
      } else if (apiUnit === 'imperial') {
        apiUnit = 'metric';
      }

      getCurrentWeather(cityName, apiKey, apiUnit);
      getThreeDaysForecast(cityName, apiKey, apiUnit);
      localStorage.setItem('unit', JSON.stringify(apiUnit));
    };
  });
};

runApp();

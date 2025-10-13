export default async function handler(request, response) {
    const { cidade } = request.query;

    const apiKey = process.env.API_KEY;

    const result = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`);

    const data = await result.json();

    response.status(200).json(data);
}

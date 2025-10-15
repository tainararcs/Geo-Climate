export default async function handler(request, response) {
    const { city } = request.query;
    const apiKey = process.env.API_KEY;

    try {
    const result = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`);

    const data = await result.json();

    if (!result.ok) {
        // Repassa o status original e a mensagem do OpenWeatherMap.
        return response
        .status(result.status)
        .json({ message: data.message || 'Erro: cidade não encontrada' });
    }

    return response.status(200).json(data);

    } catch (err) {
        console.error('Erro na rota /api/climate:', err);
        return response.status(500).json({ message: 'Erro interno no servidor' });
    }
}

import { mockAreas } from "./mockData";

const USE_MOCK = true; // toggle when James's endpoints are live

export async function getAreas() {
    if (USE_MOCK) {
        // simulate network delay
        await new Promise((res) => setTimeout(res, 400));
        return mockAreas;
    }

    const res = await axios.get("/api/areas");
    return res.data;
}
export const mockAreas = [
    {
        areaId: 1,
        areaName: "Maitland St, Martin St (Elles to Princess)",
        areaType: "zone",
        currentStatus: "adopted",
        geometry: {
            type: "Polygon",
            coordinates: [[
                [168.3630, -46.4280],
                [168.3643, -46.4280],
                [168.3643, -46.4301],
                [168.3630, -46.4301],
                [168.3630, -46.4280],
            ]],
        },
    },
    {
        areaId: 2,
        areaName: "Bain Park",
        areaType: "zone",
        currentStatus: "adopted",
        geometry: {
            type: "Polygon",
            coordinates: [
                [
                    [168.3705, -46.4270],
                    [168.3720, -46.4270],
                    [168.3720, -46.4291],
                    [168.3702, -46.4291],
                    [168.3705, -46.4270],
                ],
            ],
        },
    },
    {
        areaId: 3,
        areaName: "Scott St (Elles to McQuarrie)",
        areaType: "street",
        currentStatus: "adopted",
        geometry: {
            type: "LineString",
            coordinates: [
                [168.3615, -46.4358],
                [168.3715, -46.4360],
            ],
        },
    },
];
export const TEAMS = [
    { name: "Data & Production", id: "564" },
    { name: "Data & Services", id: "566" },
    { name: "Data & Retail", id: "567" },
    { name: "Data & Society", id: "568" },
    { name: "Data & Mutuelle", id: "579" }
]
export const TEAM_RECURRING = "789"
export const TEAM_NON_RECURRING = "790"

export const COLUMNS = [
    { name: "Stand-By", id: 2962 },
    { name: "Opportunités détectées", id: 2351 },
    { name: "Taux transfo faible", id: 2348 },
    { name: "A transformer", id: 2350 },
    { name: "Négociation/Contractualisation", id: 1906 }
]

export function teamIdFromName(name) {
    const team = TEAMS.find(e => e.name === name)
    return team && team.id
}

export function columnNameFromID(id) {
    const col = COLUMNS.find(e => e.id === id)
    return col && col.name
}
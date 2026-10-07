// User roles
export type UserRole = "super_admin" | "judge" | "captain" | "company";

// User interface
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    slug?: string;
    mustChangePassword?: boolean;
    permissions?: {
        circuits: boolean;
        stages: boolean;
        teams: boolean;
        scores: boolean;
        rankings: boolean;
        financial: boolean;
    };
    createdAt: Date;
}

// Circuit interface
export interface Circuit {
    id: string;
    companyId?: string; // ID da empresa proprietária
    name: string;
    year: number;
    active: boolean;
    regulation?: string; // Regulamento do circuito (HTML/Rich Text)
    modalityBoat?: boolean;
    modalityKayak?: boolean;
    fishCount?: number; // Quantidade de peixes válidos (ex: 4, 5, 6)
    createdAt: Date;
}

// Stage interface
export interface Stage {
    id: string;
    companyId?: string; // ID da empresa proprietária
    circuitId: string;
    name: string;
    date: Date;
    location: string;
    registrationFee: number;
    imageUrl?: string; // URL da imagem da etapa (opcional)
    status: "active" | "finished"; // Controle de visibilidade
    createdAt: Date;
    // GPS Tracking fields
    gpsTrackingEnabled?: boolean;
    gpsStartTime?: string;    // HH:MM format
    gpsEndTime?: string;      // HH:MM format
    gpsUpdateInterval?: number; // seconds
}

// Team member interface
export interface TeamMember {
    name: string;        // Nome completo
    nickname: string;    // Apelido
    rg: string;          // RG ou CPF
}

// Team interface
export interface Team {
    id: string;
    stageId: string;
    userId?: string;               // ID do usuario pescador/capitao proprietario
    teamName: string;              // Nome da equipe
    city: string;                  // Cidade da equipe
    responsibleName: string;       // Nome do responsável
    responsibleEmail: string;      // Email do responsável
    responsiblePhone: string;      // Telefone principal (obrigatório)
    responsiblePhone2?: string;    // Telefone secundário (opcional)
    members: TeamMember[];         // 4 membros: capitão, pescador1, pescador2, reserva
    paid: boolean;
    paymentMethod?: "pix" | "credit_card";
    registeredAt: Date;
}

// Result interface
export interface Result {
    id: string;
    teamId: string;
    stageId: string;
    circuitId: string;
    fishMeasurements: number[]; // Array of up to 6 measurements in cm
    fishColors: ("blue" | "yellow" | null)[]; // Cor de cada peixe
    averageScore: number; // Calculated as sum / 6
    biggestBlue?: number; // Maior tucunaré azul da equipe
    biggestYellow?: number; // Maior tucunaré amarelo da equipe
    createdAt: Date;
    updatedAt: Date;
}

// Carousel image interface
export interface CarouselImage {
    id: string;
    url: string;
    alt: string;
    link_url?: string; // URL para onde a imagem deve redirecionar ao clicar
    order: number;
    createdAt: Date;
}

// Stage ranking entry
export interface StageRankingEntry {
    rank: number;
    team: Team;
    result: Result;
}

// Circuit ranking entry
export interface CircuitRankingEntry {
    rank: number;
    team: Team;
    stageResults: Result[];
    totalScore: number;
}

// Event Logo
export interface EventLogo {
    id: string;
    name: string;
    imageUrl: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

// Sponsor Logo
export interface SponsorLogo {
    id: string;
    name: string;
    imageUrl: string;
    linkUrl?: string;
    displayOrder: number;
    active: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

// Stage Image
export interface StageImage {
    id: string;
    stageId: string;
    imageUrl: string;
    description?: string;
    displayOrder: number;
    createdAt: Date;
}

// Champion Gallery
export interface ChampionGallery {
    id: string;
    stageId?: string;
    teamId?: string;
    imageUrl: string;
    caption?: string;
    displayOrder: number;
    createdAt: Date;
}


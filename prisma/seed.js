"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var password, owner1, owner2, owner3, customer, spa1, massageService1, facialService1, spa2, spaService2, yogaService2, spa3, aromaService3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Clear existing data
                return [4 /*yield*/, prisma.cancellation.deleteMany()];
                case 1:
                    // Clear existing data
                    _a.sent();
                    return [4 /*yield*/, prisma.booking.deleteMany()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.employee.deleteMany()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.subservice.deleteMany()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.service.deleteMany()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.spa.deleteMany()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.deleteMany()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, bcryptjs_1.hash)('password123', 10)
                        // Create Users
                    ];
                case 8:
                    password = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: 'owner@example.com',
                                name: 'Maria Johnson',
                                hashedPassword: password,
                                role: client_1.Role.OWNER,
                            },
                        })];
                case 9:
                    owner1 = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: 'owner2@example.com',
                                name: 'David Williams',
                                hashedPassword: password,
                                role: client_1.Role.OWNER,
                            },
                        })];
                case 10:
                    owner2 = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: 'owner3@example.com',
                                name: 'Sarah Chen',
                                hashedPassword: password,
                                role: client_1.Role.OWNER,
                            },
                        })];
                case 11:
                    owner3 = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: 'customer@example.com',
                                name: 'John Customer',
                                hashedPassword: password,
                                role: client_1.Role.USER,
                            },
                        })
                        // Spa 1: Emerald Bay Spa
                    ];
                case 12:
                    customer = _a.sent();
                    return [4 /*yield*/, prisma.spa.create({
                            data: {
                                ownerId: owner1.id,
                                name: 'Emerald Bay Spa',
                                slug: 'emerald-bay-spa',
                                description: 'Modern wellness retreat in the heart of Saint Lucia.',
                                coverUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=400&fit=crop',
                                address: '123 Beach Road, Castries, Saint Lucia',
                                phone: '+1 758-555-0100',
                                email: 'info@emeraldbay.com',
                                businessHours: {
                                    mon: ['09:00-17:00'],
                                    tue: ['09:00-17:00'],
                                    wed: ['09:00-17:00'],
                                    thu: ['09:00-17:00'],
                                    fri: ['09:00-18:00'],
                                    sat: ['10:00-16:00'],
                                    sun: [],
                                },
                            },
                        })];
                case 13:
                    spa1 = _a.sent();
                    return [4 /*yield*/, prisma.service.create({
                            data: {
                                spaId: spa1.id,
                                name: 'Massage Therapy',
                                description: 'Professional therapeutic massages.',
                            },
                        })];
                case 14:
                    massageService1 = _a.sent();
                    return [4 /*yield*/, prisma.service.create({
                            data: {
                                spaId: spa1.id,
                                name: 'Facials',
                                description: 'Rejuvenating facial treatments.',
                            },
                        })];
                case 15:
                    facialService1 = _a.sent();
                    return [4 /*yield*/, prisma.subservice.createMany({
                            data: [
                                {
                                    spaId: spa1.id,
                                    serviceId: massageService1.id,
                                    name: 'Deep Tissue Massage',
                                    description: 'Intense pressure to relieve tension',
                                    durationMin: 60,
                                    priceCents: 12000,
                                },
                                {
                                    spaId: spa1.id,
                                    serviceId: massageService1.id,
                                    name: 'Swedish Massage',
                                    description: 'Gentle, relaxing full-body massage',
                                    durationMin: 60,
                                    priceCents: 10000,
                                },
                                {
                                    spaId: spa1.id,
                                    serviceId: massageService1.id,
                                    name: 'Hot Stone Massage',
                                    description: 'Heated stones for deep relaxation',
                                    durationMin: 90,
                                    priceCents: 15000,
                                },
                                {
                                    spaId: spa1.id,
                                    serviceId: facialService1.id,
                                    name: 'Classic Facial',
                                    description: 'Deep cleansing and hydration',
                                    durationMin: 45,
                                    priceCents: 8500,
                                },
                                {
                                    spaId: spa1.id,
                                    serviceId: facialService1.id,
                                    name: 'Anti-Aging Facial',
                                    description: 'Collagen-boosting treatment',
                                    durationMin: 60,
                                    priceCents: 12500,
                                },
                            ],
                        })];
                case 16:
                    _a.sent();
                    return [4 /*yield*/, prisma.employee.createMany({
                            data: [
                                {
                                    spaId: spa1.id,
                                    name: 'Ava Thomas',
                                    bio: 'Senior massage therapist with 10+ years experience',
                                    schedule: {
                                        mon: ['09:00-17:00'],
                                        tue: ['09:00-17:00'],
                                        wed: ['09:00-17:00'],
                                    },
                                },
                                {
                                    spaId: spa1.id,
                                    name: 'Noah James',
                                    bio: 'Deep tissue and sports massage specialist',
                                    schedule: {
                                        thu: ['09:00-17:00'],
                                        fri: ['09:00-18:00'],
                                        sat: ['10:00-16:00'],
                                    },
                                },
                                {
                                    spaId: spa1.id,
                                    name: 'Olivia Martinez',
                                    bio: 'Licensed esthetician and facial expert',
                                    schedule: {
                                        mon: ['09:00-17:00'],
                                        wed: ['09:00-17:00'],
                                        fri: ['09:00-18:00'],
                                    },
                                },
                            ],
                        })
                        // Spa 2: Paradise Wellness Center
                    ];
                case 17:
                    _a.sent();
                    return [4 /*yield*/, prisma.spa.create({
                            data: {
                                ownerId: owner2.id,
                                name: 'Paradise Wellness Center',
                                slug: 'paradise-wellness',
                                description: 'Luxury spa offering holistic treatments and ocean views.',
                                coverUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=400&fit=crop&q=80',
                                address: '456 Ocean Drive, Soufrière, Saint Lucia',
                                phone: '+1 758-555-0200',
                                email: 'contact@paradisewellness.com',
                                colorPrimary: '#3B82F6',
                                businessHours: {
                                    mon: ['08:00-19:00'],
                                    tue: ['08:00-19:00'],
                                    wed: ['08:00-19:00'],
                                    thu: ['08:00-19:00'],
                                    fri: ['08:00-20:00'],
                                    sat: ['09:00-20:00'],
                                    sun: ['10:00-18:00'],
                                },
                            },
                        })];
                case 18:
                    spa2 = _a.sent();
                    return [4 /*yield*/, prisma.service.create({
                            data: {
                                spaId: spa2.id,
                                name: 'Body Treatments',
                                description: 'Full body pampering.',
                            },
                        })];
                case 19:
                    spaService2 = _a.sent();
                    return [4 /*yield*/, prisma.service.create({
                            data: {
                                spaId: spa2.id,
                                name: 'Wellness Classes',
                                description: 'Yoga and meditation.',
                            },
                        })];
                case 20:
                    yogaService2 = _a.sent();
                    return [4 /*yield*/, prisma.subservice.createMany({
                            data: [
                                {
                                    spaId: spa2.id,
                                    serviceId: spaService2.id,
                                    name: 'Body Scrub & Wrap',
                                    description: 'Exfoliation and nourishing wrap',
                                    durationMin: 75,
                                    priceCents: 14000,
                                },
                                {
                                    spaId: spa2.id,
                                    serviceId: spaService2.id,
                                    name: 'Detox Body Treatment',
                                    description: 'Clay mask and lymphatic drainage',
                                    durationMin: 90,
                                    priceCents: 16500,
                                },
                                {
                                    spaId: spa2.id,
                                    serviceId: yogaService2.id,
                                    name: 'Private Yoga Session',
                                    description: 'One-on-one yoga instruction',
                                    durationMin: 60,
                                    priceCents: 9000,
                                },
                                {
                                    spaId: spa2.id,
                                    serviceId: yogaService2.id,
                                    name: 'Meditation Class',
                                    description: 'Guided meditation for relaxation',
                                    durationMin: 45,
                                    priceCents: 5000,
                                },
                            ],
                        })];
                case 21:
                    _a.sent();
                    return [4 /*yield*/, prisma.employee.createMany({
                            data: [
                                {
                                    spaId: spa2.id,
                                    name: 'Liam Rodriguez',
                                    bio: 'Certified yoga instructor and wellness coach',
                                    schedule: {
                                        mon: ['08:00-19:00'],
                                        tue: ['08:00-19:00'],
                                        wed: ['08:00-19:00'],
                                        thu: ['08:00-19:00'],
                                    },
                                },
                                {
                                    spaId: spa2.id,
                                    name: 'Emma Wilson',
                                    bio: 'Body treatment specialist',
                                    schedule: {
                                        fri: ['08:00-20:00'],
                                        sat: ['09:00-20:00'],
                                        sun: ['10:00-18:00'],
                                    },
                                },
                            ],
                        })
                        // Spa 3: Tranquil Touch Spa
                    ];
                case 22:
                    _a.sent();
                    return [4 /*yield*/, prisma.spa.create({
                            data: {
                                ownerId: owner3.id,
                                name: 'Tranquil Touch Spa',
                                slug: 'tranquil-touch',
                                description: 'Intimate boutique spa specializing in aromatherapy and reflexology.',
                                coverUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=400&fit=crop',
                                address: '789 Sunset Boulevard, Gros Islet, Saint Lucia',
                                phone: '+1 758-555-0300',
                                email: 'hello@tranquiltouch.com',
                                colorPrimary: '#8B5CF6',
                                businessHours: {
                                    mon: ['10:00-18:00'],
                                    tue: ['10:00-18:00'],
                                    wed: ['10:00-18:00'],
                                    thu: ['10:00-18:00'],
                                    fri: ['10:00-19:00'],
                                    sat: ['10:00-17:00'],
                                    sun: [],
                                },
                            },
                        })];
                case 23:
                    spa3 = _a.sent();
                    return [4 /*yield*/, prisma.service.create({
                            data: {
                                spaId: spa3.id,
                                name: 'Aromatherapy',
                                description: 'Essential oil-based treatments.',
                            },
                        })];
                case 24:
                    aromaService3 = _a.sent();
                    return [4 /*yield*/, prisma.subservice.createMany({
                            data: [
                                {
                                    spaId: spa3.id,
                                    serviceId: aromaService3.id,
                                    name: 'Aromatherapy Massage',
                                    description: 'Custom essential oil blend massage',
                                    durationMin: 75,
                                    priceCents: 13500,
                                },
                                {
                                    spaId: spa3.id,
                                    serviceId: aromaService3.id,
                                    name: 'Reflexology',
                                    description: 'Pressure point foot massage',
                                    durationMin: 45,
                                    priceCents: 7500,
                                },
                                {
                                    spaId: spa3.id,
                                    serviceId: aromaService3.id,
                                    name: 'Couples Massage',
                                    description: 'Side-by-side relaxation for two',
                                    durationMin: 60,
                                    priceCents: 22000,
                                },
                            ],
                        })];
                case 25:
                    _a.sent();
                    return [4 /*yield*/, prisma.employee.createMany({
                            data: [
                                {
                                    spaId: spa3.id,
                                    name: 'Sophia Anderson',
                                    bio: 'Certified aromatherapist and reflexologist',
                                    schedule: {
                                        mon: ['10:00-18:00'],
                                        wed: ['10:00-18:00'],
                                        fri: ['10:00-19:00'],
                                    },
                                },
                                {
                                    spaId: spa3.id,
                                    name: 'James Brown',
                                    bio: 'Holistic wellness practitioner',
                                    schedule: {
                                        tue: ['10:00-18:00'],
                                        thu: ['10:00-18:00'],
                                        sat: ['10:00-17:00'],
                                    },
                                },
                            ],
                        })];
                case 26:
                    _a.sent();
                    console.log('✅ Seeded successfully!');
                    console.log('\n📊 Summary:');
                    console.log("- 4 Users (3 spa owners, 1 customer)");
                    console.log("- 3 Spas:");
                    console.log("  \u2022 ".concat(spa1.name, " (slug: ").concat(spa1.slug, ")"));
                    console.log("  \u2022 ".concat(spa2.name, " (slug: ").concat(spa2.slug, ")"));
                    console.log("  \u2022 ".concat(spa3.name, " (slug: ").concat(spa3.slug, ")"));
                    console.log("\n\uD83D\uDD11 Login credentials:");
                    console.log("  Customer:");
                    console.log("    Email: customer@example.com");
                    console.log("    Password: password123");
                    console.log("\n  Spa Owner (Emerald Bay Spa):");
                    console.log("    Email: owner@example.com");
                    console.log("    Password: password123");
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });

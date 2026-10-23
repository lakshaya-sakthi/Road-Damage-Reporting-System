import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Department from '../models/Department.js';
import DamageReport from '../models/DamageReport.js';
import Assignment from '../models/Assignment.js';
import RepairEvidence from '../models/RepairEvidence.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_road_damage_db';
  console.log(`[Seed Script] Connecting to MongoDB at ${uri}...`);

  try {
    await mongoose.connect(uri);
    console.log('[Seed Script] Connected. Clearing collections for fresh seed...');

    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      DamageReport.deleteMany({}),
      Assignment.deleteMany({}),
      RepairEvidence.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    // 1. Seed Departments / Service Areas
    console.log('[Seed Script] Seeding service areas...');
    const departments = await Department.create([
      {
        name: 'Central District',
        code: 'CD-01',
        description: 'Metropolitan core arterial network and primary commercial avenues',
        centerCoordinates: { lat: 13.0827, lng: 80.2707 },
        coverageRadiusKm: 15
      },
      {
        name: 'North Highway Corridor',
        code: 'NC-02',
        description: 'Interstate arterial highway connector and high-speed bypasses',
        centerCoordinates: { lat: 13.1420, lng: 80.2200 },
        coverageRadiusKm: 25
      },
      {
        name: 'Downtown Metro',
        code: 'DM-03',
        description: 'Dense municipal roads, bus rapid transit corridors, pedestrian zones',
        centerCoordinates: { lat: 13.0600, lng: 80.2500 },
        coverageRadiusKm: 12
      },
      {
        name: 'East Industrial Belt',
        code: 'EB-04',
        description: 'Heavy logistics corridors, freight shipping truck terminals, port access',
        centerCoordinates: { lat: 13.0300, lng: 80.2800 },
        coverageRadiusKm: 20
      }
    ]);

    // 2. Seed Users across all 5 roles
    console.log('[Seed Script] Seeding users with secure roles...');
    const users = await User.create([
      {
        name: 'Chief Admin Sarah Jenkins',
        email: 'admin@roadguard.io',
        password: 'Admin@12345',
        role: 'admin',
        department: 'Operations Command',
        serviceArea: 'Central District',
        phone: '+1 (555) 010-0001'
      },
      {
        name: 'District Supervisor Marcus Vance',
        email: 'supervisor@roadguard.io',
        password: 'Supervisor@12345',
        role: 'supervisor',
        department: 'Central District Maintenance',
        serviceArea: 'Central District',
        phone: '+1 (555) 010-0002'
      },
      {
        name: 'Supervisor Elena Rostova',
        email: 'supervisor.north@roadguard.io',
        password: 'Supervisor@12345',
        role: 'supervisor',
        department: 'North Highway Authority',
        serviceArea: 'North Highway Corridor',
        phone: '+1 (555) 010-0003'
      },
      {
        name: 'Field Inspector Alex Rivera',
        email: 'inspector@roadguard.io',
        password: 'Inspector@12345',
        role: 'field_inspector',
        department: 'Road Quality Survey Team',
        serviceArea: 'Central District',
        phone: '+1 (555) 010-0004'
      },
      {
        name: 'Crew Lead Carlos Mendez',
        email: 'worker@roadguard.io',
        password: 'Worker@12345',
        role: 'worker',
        department: 'Pavement Rapid Response Crew 1',
        serviceArea: 'Central District',
        phone: '+1 (555) 010-0005',
        workerProfile: {
          skills: ['asphalt_patching', 'crack_sealing', 'emergency_filling'],
          equipment: ['compactor', 'hotbox', 'tar_kettle'],
          maxConcurrentJobs: 3,
          currentActiveJobs: 1,
          availabilityStatus: 'busy',
          currentCoordinates: { lat: 13.0850, lng: 80.2680, updatedAt: new Date() }
        }
      },
      {
        name: 'Specialist Priya Sharma',
        email: 'worker.priya@roadguard.io',
        password: 'Worker@12345',
        role: 'worker',
        department: 'Pavement Rapid Response Crew 2',
        serviceArea: 'Central District',
        phone: '+1 (555) 010-0006',
        workerProfile: {
          skills: ['asphalt_patching', 'subgrade_assessment', 'micro_surfacing'],
          equipment: ['cold_planer', 'compactor', 'slurry_seal_spreader'],
          maxConcurrentJobs: 3,
          currentActiveJobs: 0,
          availabilityStatus: 'available',
          currentCoordinates: { lat: 13.0780, lng: 80.2740, updatedAt: new Date() }
        }
      },
      {
        name: 'Heavy Ops Dave Kowalski',
        email: 'worker.dave@roadguard.io',
        password: 'Worker@12345',
        role: 'worker',
        department: 'Highway Heavy Repair Unit',
        serviceArea: 'North Highway Corridor',
        phone: '+1 (555) 010-0007',
        workerProfile: {
          skills: ['surface_milling', 'overlay', 'asphalt_patching'],
          equipment: ['cold_planer', 'paver', 'roller', 'jackhammer'],
          maxConcurrentJobs: 4,
          currentActiveJobs: 2,
          availabilityStatus: 'busy',
          currentCoordinates: { lat: 13.1450, lng: 80.2180, updatedAt: new Date() }
        }
      },
      {
        name: 'Compliance Auditor Rachel Cole',
        email: 'auditor@roadguard.io',
        password: 'Auditor@12345',
        role: 'auditor',
        department: 'Municipal Infrastructure Oversight',
        serviceArea: 'Central District',
        phone: '+1 (555) 010-0008'
      }
    ]);

    const adminUser = users.find((u) => u.role === 'admin');
    const supervisorCentral = users.find((u) => u.email === 'supervisor@roadguard.io');
    const inspectorUser = users.find((u) => u.role === 'field_inspector');
    const workerCarlos = users.find((u) => u.email === 'worker@roadguard.io');
    const workerPriya = users.find((u) => u.email === 'worker.priya@roadguard.io');

    // 3. Seed Realistic Reports across workflow states
    console.log('[Seed Script] Seeding reports across full workflow lifecycle...');

    // Report 1: In Progress repair by Carlos
    const report1 = await DamageReport.create({
      reportNumber: 'RDR-2026-0001',
      title: 'Deep Structural Pothole at 4th Cross Ave',
      description: 'Extensive pavement cavity approximately 60cm diameter causing significant traffic swerving.',
      imageUrl: '/uploads/sample-pothole-1.jpg',
      surfaceType: 'Asphalt',
      location: {
        address: '4th Cross Ave & Mount Road, Central District',
        coordinates: { lat: 13.0815, lng: 80.2720 },
        serviceArea: 'Central District'
      },
      reportedBy: inspectorUser._id,
      status: 'in_progress',
      priority: 'Critical',
      aiAnalysis: {
        analyzedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
        modelVersion: 'YOLOv8-RDD',
        status: 'success',
        inferenceSource: 'real_yolo_weights',
        detections: [
          {
            class_code: 'D40',
            class_name: 'Pothole',
            confidence: 0.94,
            box: { xmin: 120, ymin: 240, xmax: 480, ymax: 560 },
            required_skills: ['asphalt_patching', 'emergency_filling'],
            required_equipment: ['compactor', 'hotbox', 'jackhammer']
          }
        ],
        primaryDamageType: 'Pothole',
        overallConfidence: 0.94,
        calculatedSeverity: 'Critical',
        reviewRequired: false,
        technicalDisclaimer: 'Surface optical evaluation only.'
      },
      statusHistory: [
        {
          status: 'detected',
          changedBy: inspectorUser._id,
          changedByName: inspectorUser.name,
          note: 'Logged via field mobile device.',
          timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000)
        },
        {
          status: 'assigned',
          changedBy: null,
          changedByName: 'System Auto-Engine',
          note: 'Auto-assigned to Carlos Mendez based on 0.8km proximity and compactor availability.',
          timestamp: new Date(Date.now() - 34 * 60 * 60 * 1000)
        },
        {
          status: 'accepted',
          changedBy: workerCarlos._id,
          changedByName: workerCarlos.name,
          note: 'Worker accepted assignment.',
          timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000)
        },
        {
          status: 'in_progress',
          changedBy: workerCarlos._id,
          changedByName: workerCarlos.name,
          note: 'Excavation of loose debris in progress; tack coat applied.',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
        }
      ]
    });

    const assign1 = await Assignment.create({
      reportId: report1._id,
      workerId: workerCarlos._id,
      assignedByType: 'system_auto_allocator',
      scoreBreakdown: {
        proximityScore: 94,
        capacityScore: 67,
        skillScore: 100,
        totalScore: 87,
        distanceKm: 0.6
      },
      status: 'in_progress',
      targetCompletionDate: new Date(Date.now() + 20 * 60 * 60 * 1000),
      assignedAt: new Date(Date.now() - 34 * 60 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    });
    report1.currentAssignment = assign1._id;
    await report1.save();

    // Report 2: Review Required (Low Confidence AI detection)
    const report2 = await DamageReport.create({
      reportNumber: 'RDR-2026-0002',
      title: 'Subsurface Fatigue Alligator Cracking on Bridge Approach',
      description: 'Spider-web pattern observed under wet weather conditions.',
      imageUrl: '/uploads/sample-crack-1.jpg',
      surfaceType: 'Asphalt',
      location: {
        address: 'Poonamallee High Road, Central District',
        coordinates: { lat: 13.0790, lng: 80.2640 },
        serviceArea: 'Central District'
      },
      reportedBy: inspectorUser._id,
      status: 'review_required',
      priority: 'High',
      aiAnalysis: {
        analyzedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        modelVersion: 'YOLOv8-RDD',
        status: 'success',
        inferenceSource: 'real_yolo_weights',
        detections: [
          {
            class_code: 'D20',
            class_name: 'Alligator Crack',
            confidence: 0.52,
            box: { xmin: 80, ymin: 150, xmax: 600, ymax: 720 },
            required_skills: ['asphalt_patching', 'subgrade_assessment'],
            required_equipment: ['cold_planer', 'compactor']
          }
        ],
        primaryDamageType: 'Alligator Crack',
        overallConfidence: 0.52,
        calculatedSeverity: 'High',
        reviewRequired: true,
        reviewReason: 'Detection confidence is 52% (below 60% threshold). Supervisor verification mandatory.',
        technicalDisclaimer: 'Surface optical evaluation only.'
      },
      statusHistory: [
        {
          status: 'detected',
          changedBy: inspectorUser._id,
          changedByName: inspectorUser.name,
          note: 'Logged by inspector during post-rain survey.',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000)
        },
        {
          status: 'review_required',
          changedBy: null,
          changedByName: 'System Auto-Engine',
          note: 'AI confidence score (52%) falls below the 60% confidence threshold. Awaiting supervisor confirmation.',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000)
        }
      ]
    });

    // Report 3: Completed repair ready for Supervisor Verification
    const report3 = await DamageReport.create({
      reportNumber: 'RDR-2026-0003',
      title: 'Transverse Expansion Crack near Transit Hub',
      description: 'Continuous crack running perpendicular across lane 2 and 3.',
      imageUrl: '/uploads/sample-crack-2.jpg',
      surfaceType: 'Asphalt',
      location: {
        address: 'Gandhi Irwin Road, Central District',
        coordinates: { lat: 13.0830, lng: 80.2780 },
        serviceArea: 'Central District'
      },
      reportedBy: inspectorUser._id,
      status: 'completed',
      priority: 'Medium',
      aiAnalysis: {
        analyzedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        modelVersion: 'YOLOv8-RDD',
        status: 'success',
        inferenceSource: 'real_yolo_weights',
        detections: [
          {
            class_code: 'D10',
            class_name: 'Transverse Crack',
            confidence: 0.88,
            box: { xmin: 50, ymin: 300, xmax: 750, ymax: 420 },
            required_skills: ['crack_sealing'],
            required_equipment: ['tar_kettle', 'surface_cleaner']
          }
        ],
        primaryDamageType: 'Transverse Crack',
        overallConfidence: 0.88,
        calculatedSeverity: 'Medium',
        reviewRequired: false,
        technicalDisclaimer: 'Surface optical evaluation only.'
      },
      statusHistory: [
        {
          status: 'detected',
          changedBy: inspectorUser._id,
          changedByName: inspectorUser.name,
          note: 'Initial report logged.',
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000)
        },
        {
          status: 'assigned',
          changedBy: null,
          changedByName: 'System Auto-Engine',
          note: 'Auto-assigned to Priya Sharma.',
          timestamp: new Date(Date.now() - 46 * 60 * 60 * 1000)
        },
        {
          status: 'completed',
          changedBy: workerPriya._id,
          changedByName: workerPriya.name,
          note: 'Crack sealed with hot-pour rubberized bitumen. Photo submitted.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ]
    });

    const assign3 = await Assignment.create({
      reportId: report3._id,
      workerId: workerPriya._id,
      assignedByType: 'system_auto_allocator',
      scoreBreakdown: {
        proximityScore: 92,
        capacityScore: 100,
        skillScore: 100,
        totalScore: 96,
        distanceKm: 0.8
      },
      status: 'completed',
      targetCompletionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      assignedAt: new Date(Date.now() - 46 * 60 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 44 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });
    report3.currentAssignment = assign3._id;
    await report3.save();

    await RepairEvidence.create({
      assignmentId: assign3._id,
      reportId: report3._id,
      workerId: workerPriya._id,
      beforeImageUrl: report3.imageUrl,
      afterImageUrl: '/uploads/sample-repair-after.jpg',
      repairNotes: 'Cleaned crack with high-pressure air lance, preheated edges, applied ASTM D6690 hot-pour polymer sealant, and leveled flush with road surface.',
      materialsUsed: ['Polymer modified rubberized asphalt sealant', 'Mineral fine topping'],
      laborHours: 2.5,
      verificationStatus: 'pending_review'
    });

    // Report 4: Unassigned / Overloaded capacity
    await DamageReport.create({
      reportNumber: 'RDR-2026-0004',
      title: 'Severe Edge Drop-off & Pavement Cavity',
      description: 'Right shoulder edge erosion exceeding 10cm depth posing rollover risk to turning trucks.',
      imageUrl: '/uploads/sample-pothole-2.jpg',
      surfaceType: 'Asphalt',
      location: {
        address: 'Grand Southern Trunk Road, Central District',
        coordinates: { lat: 13.0720, lng: 80.2690 },
        serviceArea: 'Central District'
      },
      reportedBy: inspectorUser._id,
      status: 'unassigned',
      priority: 'Critical',
      aiAnalysis: {
        analyzedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        modelVersion: 'YOLOv8-RDD',
        status: 'success',
        inferenceSource: 'real_yolo_weights',
        detections: [
          {
            class_code: 'D40',
            class_name: 'Pothole',
            confidence: 0.91,
            box: { xmin: 200, ymin: 300, xmax: 650, ymax: 600 },
            required_skills: ['asphalt_patching', 'subgrade_assessment'],
            required_equipment: ['compactor', 'hotbox']
          }
        ],
        primaryDamageType: 'Pothole',
        overallConfidence: 0.91,
        calculatedSeverity: 'Critical',
        reviewRequired: false,
        technicalDisclaimer: 'Surface optical evaluation only.'
      },
      statusHistory: [
        {
          status: 'detected',
          changedBy: inspectorUser._id,
          changedByName: inspectorUser.name,
          note: 'Logged by inspector.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
        },
        {
          status: 'unassigned',
          changedBy: null,
          changedByName: 'System Auto-Engine',
          note: 'Candidate workers reached concurrent job ceilings. Placed into supervisor unassigned queue.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
        }
      ]
    });

    // 4. Seed Audit Logs
    console.log('[Seed Script] Seeding audit trails...');
    await AuditLog.create([
      {
        action: 'SYSTEM_INITIALIZATION',
        entityType: 'System',
        entityId: 'SYSTEM-ROOT',
        performedByName: 'Sarah Jenkins (Chief Admin)',
        performedByRole: 'admin',
        details: { mode: 'fresh_seed', districts: 4, baseline_workers: 3 },
        ipAddress: '127.0.0.1'
      },
      {
        action: 'REPORT_INGEST_AI_ANALYSIS',
        entityType: 'Report',
        entityId: report1._id,
        performedByName: 'Alex Rivera (Field Inspector)',
        performedByRole: 'field_inspector',
        details: { reportNumber: report1.reportNumber, confidence: 0.94, severity: 'Critical' },
        ipAddress: '127.0.0.1'
      },
      {
        action: 'AUTOMATED_DISPATCH',
        entityType: 'Assignment',
        entityId: assign1._id,
        performedByName: 'System Auto-Engine',
        performedByRole: 'system',
        details: { worker: 'Carlos Mendez', score: 87, priority: 'Critical' },
        ipAddress: '127.0.0.1'
      }
    ]);

    // 5. Seed Notifications
    console.log('[Seed Script] Seeding initial notifications...');
    await Notification.create([
      {
        recipientId: workerCarlos._id,
        title: `Active Job: ${report1.reportNumber}`,
        message: `You are assigned to repair road damage at ${report1.location.address}. Target SLA: Today.`,
        type: 'assignment',
        relatedReportId: report1._id,
        isRead: false
      },
      {
        recipientId: supervisorCentral._id,
        title: `Supervisor Review Required: ${report2.reportNumber}`,
        message: `New report on ${report2.location.address} has AI confidence 52%. Please verify before maintenance dispatch.`,
        type: 'review_required',
        relatedReportId: report2._id,
        isRead: false
      },
      {
        recipientId: supervisorCentral._id,
        title: `Verification Ready: ${report3.reportNumber}`,
        message: `Worker Priya Sharma submitted completion photo for ${report3.location.address}. Awaiting your sign-off.`,
        type: 'repair_completed',
        relatedReportId: report3._id,
        isRead: false
      }
    ]);

    console.log('------------------------------------------------------------');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Demo Credentials for All 5 Roles:');
    console.log('  - Admin:            admin@roadguard.io       / Admin@12345');
    console.log('  - Supervisor:       supervisor@roadguard.io  / Supervisor@12345');
    console.log('  - Field Inspector:  inspector@roadguard.io   / Inspector@12345');
    console.log('  - Maint. Worker:    worker@roadguard.io      / Worker@12345');
    console.log('  - Auditor:          auditor@roadguard.io     / Auditor@12345');
    console.log('------------------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();

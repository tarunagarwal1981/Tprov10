/**
 * Script to check field mapping between frontend form and database
 * Compares ActivityPackageFormData with activity_packages table schema
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
require('dotenv').config({ path: '.env.local' });

// Use provided AWS credentials
process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'REDACTED_AWS_ACCESS_KEY';
process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '/REDACTED_AWS_SECRET_KEY/';
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Use Lambda to query database
async function queryViaLambda(query, params = []) {
  const lambdaClient = new LambdaClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const command = new InvokeCommand({
    FunctionName: 'travel-app-database-service',
    Payload: JSON.stringify({
      action: 'query',
      query,
      params,
    }),
  });

  const response = await lambdaClient.send(command);
  const result = JSON.parse(Buffer.from(response.Payload).toString());
  
  if (result.statusCode !== 200) {
    const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    throw new Error(errorBody.error || errorBody.message || 'Lambda error');
  }
  
  const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  return body;
}

// Frontend form fields structure (from ActivityPackageFormData)
const frontendFields = {
  // Basic Information
  'basicInformation.title': 'title',
  'basicInformation.shortDescription': 'short_description',
  'basicInformation.fullDescription': 'full_description',
  'basicInformation.destination.name': 'destination_name',
  'basicInformation.destination.address': 'destination_address',
  'basicInformation.destination.city': 'destination_city',
  'basicInformation.destination.country': 'destination_country',
  'basicInformation.destination.postalCode': 'destination_postal_code',
  'basicInformation.destination.coordinates': 'destination_coordinates',
  'basicInformation.duration.hours': 'duration_hours',
  'basicInformation.duration.minutes': 'duration_minutes',
  // 'basicInformation.difficultyLevel': 'difficulty_level', // Commented out in form
  // 'basicInformation.languagesSupported': 'languages_supported', // Commented out in form
  // 'basicInformation.tags': 'tags', // Commented out in form
  
  // Activity Details
  'activityDetails.meetingPoint.name': 'meeting_point_name',
  'activityDetails.meetingPoint.address': 'meeting_point_address',
  'activityDetails.meetingPoint.coordinates': 'meeting_point_coordinates',
  'activityDetails.meetingPoint.instructions': 'meeting_point_instructions',
  'activityDetails.operationalHours.operatingDays': 'operating_days',
  'activityDetails.whatsIncluded': 'whats_included',
  'activityDetails.whatsNotIncluded': 'whats_not_included',
  'activityDetails.whatToBring': 'what_to_bring',
  'activityDetails.importantInformation': 'important_information',
  
  // Policies & Restrictions
  'policiesRestrictions.ageRestrictions.minimumAge': 'minimum_age',
  'policiesRestrictions.ageRestrictions.maximumAge': 'maximum_age',
  'policiesRestrictions.ageRestrictions.childPolicy': 'child_policy',
  'policiesRestrictions.ageRestrictions.infantPolicy': 'infant_policy',
  'policiesRestrictions.ageRestrictions.ageVerificationRequired': 'age_verification_required',
  'policiesRestrictions.accessibility.wheelchairAccessible': 'wheelchair_accessible',
  'policiesRestrictions.accessibility.facilities': 'accessibility_facilities',
  'policiesRestrictions.accessibility.specialAssistance': 'special_assistance',
  'policiesRestrictions.cancellationPolicy.type': 'cancellation_policy_type',
  'policiesRestrictions.cancellationPolicy.customPolicy': 'cancellation_policy_custom',
  'policiesRestrictions.cancellationPolicy.refundPercentage': 'cancellation_refund_percentage',
  'policiesRestrictions.cancellationPolicy.cancellationDeadline': 'cancellation_deadline_hours',
  'policiesRestrictions.weatherPolicy': 'weather_policy',
  'policiesRestrictions.healthSafety.requirements': 'health_safety_requirements',
  'policiesRestrictions.healthSafety.additionalInfo': 'health_safety_additional_info',
  
  // Pricing
  'pricing.basePrice': 'base_price',
  'pricing.currency': 'currency',
  'pricing.priceType': 'price_type',
  'pricing.childPrice.type': 'child_price_type',
  'pricing.childPrice.value': 'child_price_value',
  'pricing.infantPrice': 'infant_price',
  'pricing.groupDiscounts': 'group_discounts',
  'pricing.seasonalPricing': 'seasonal_pricing',
  'pricing.dynamicPricing.enabled': 'dynamic_pricing_enabled',
  'pricing.dynamicPricing.baseMultiplier': 'dynamic_pricing_base_multiplier',
  'pricing.dynamicPricing.demandMultiplier': 'dynamic_pricing_demand_multiplier',
  'pricing.dynamicPricing.seasonMultiplier': 'dynamic_pricing_season_multiplier',
};

async function checkFieldMapping() {
  try {
    console.log('🔍 Checking field mapping between frontend and database...\n');
    
    // Get database columns
    const dbResult = await queryViaLambda(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'activity_packages'
      ORDER BY ordinal_position;
    `);

    const dbColumns = dbResult.rows.map(row => row.column_name);
    const frontendMappedFields = Object.values(frontendFields);
    
    console.log('=== DATABASE COLUMNS ===');
    console.log(`Total columns: ${dbColumns.length}\n`);
    dbColumns.forEach(col => console.log(`  - ${col}`));
    
    console.log('\n=== FRONTEND MAPPED FIELDS ===');
    console.log(`Total mapped fields: ${frontendMappedFields.length}\n`);
    frontendMappedFields.forEach(field => console.log(`  - ${field}`));
    
    // Find unmapped database columns (excluding system fields)
    const systemFields = ['id', 'created_at', 'updated_at', 'published_at', 'slug', 'meta_title', 'meta_description'];
    const unmappedDbFields = dbColumns.filter(col => 
      !frontendMappedFields.includes(col) && !systemFields.includes(col)
    );
    
    // Find missing frontend fields (fields that should be mapped but aren't)
    const missingMappings = [];
    Object.entries(frontendFields).forEach(([frontendPath, dbField]) => {
      if (!dbColumns.includes(dbField)) {
        missingMappings.push({ frontendPath, dbField });
      }
    });
    
    console.log('\n=== ANALYSIS ===\n');
    
    if (unmappedDbFields.length > 0) {
      console.log('⚠️  UNMAPPED DATABASE FIELDS (exist in DB but not in form mapping):');
      unmappedDbFields.forEach(field => {
        const dbField = dbResult.rows.find(r => r.column_name === field);
        console.log(`  - ${field} (${dbField?.data_type.toUpperCase() || 'UNKNOWN'})`);
      });
      console.log('');
    } else {
      console.log('✅ All database fields are mapped or are system fields\n');
    }
    
    if (missingMappings.length > 0) {
      console.log('❌ MISSING MAPPINGS (in form but not in database):');
      missingMappings.forEach(({ frontendPath, dbField }) => {
        console.log(`  - ${frontendPath} → ${dbField}`);
      });
      console.log('');
    } else {
      console.log('✅ All frontend fields have corresponding database columns\n');
    }
    
    // Check for fields that might have type mismatches
    console.log('=== POTENTIAL TYPE MISMATCHES ===\n');
    const typeChecks = [
      { dbField: 'maximum_age', dbType: 'TEXT', expectedType: 'INTEGER', frontendPath: 'policiesRestrictions.ageRestrictions.maximumAge' },
      { dbField: 'dynamic_pricing_base_multiplier', dbType: 'INTEGER', expectedType: 'NUMERIC/DECIMAL', frontendPath: 'pricing.dynamicPricing.baseMultiplier' },
      { dbField: 'dynamic_pricing_demand_multiplier', dbType: 'INTEGER', expectedType: 'NUMERIC/DECIMAL', frontendPath: 'pricing.dynamicPricing.demandMultiplier' },
      { dbField: 'dynamic_pricing_season_multiplier', dbType: 'INTEGER', expectedType: 'NUMERIC/DECIMAL', frontendPath: 'pricing.dynamicPricing.seasonMultiplier' },
    ];
    
    typeChecks.forEach(check => {
      const dbField = dbResult.rows.find(r => r.column_name === check.dbField);
      if (dbField && dbField.data_type !== check.expectedType.split('/')[0]) {
        console.log(`⚠️  ${check.dbField}: DB has ${dbField.data_type}, but form expects ${check.expectedType}`);
        console.log(`   Frontend path: ${check.frontendPath}`);
      }
    });
    
    console.log('\n✅ Field mapping check complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkFieldMapping();


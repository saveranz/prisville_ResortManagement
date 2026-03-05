import db from '../server/db';

async function updateFAQPolicies() {
  try {
    console.log('🔧 Updating FAQ policies...\n');

    // Update cancellation policy FAQ
    const [cancelResult] = await db.query(`
      UPDATE faqs 
      SET answer = 'We do not allow cancellations. All bookings are final and non-refundable once confirmed. Please ensure your travel dates are confirmed before making a reservation.'
      WHERE question = 'What is your cancellation policy?'
    `);
    console.log('✅ Updated cancellation policy FAQ');

    // Update payment methods FAQ
    const [paymentResult] = await db.query(`
      UPDATE faqs 
      SET answer = 'We accept GCash and bank transfers only. You will need to upload payment proof when making your reservation.'
      WHERE question = 'What payment methods do you accept?'
    `);
    console.log('✅ Updated payment methods FAQ');

    // Verify updates
    const [faqs] = await db.query(`
      SELECT question, answer 
      FROM faqs 
      WHERE question IN ('What is your cancellation policy?', 'What payment methods do you accept?')
    `) as any[];

    console.log('\n📋 Updated FAQs:');
    faqs.forEach((faq: any) => {
      console.log(`\nQ: ${faq.question}`);
      console.log(`A: ${faq.answer}`);
    });

    console.log('\n✅ FAQ policies updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating FAQ policies:', error);
    process.exit(1);
  }
}

updateFAQPolicies();

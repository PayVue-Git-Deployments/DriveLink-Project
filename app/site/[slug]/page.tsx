import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function MerchantWebsite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch merchant by slug
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (merchantError || !merchant) {
    notFound();
  }

  // Fetch website configuration
  const { data: config, error: configError } = await supabase
    .from('merchant_website_configurations')
    .select('layout, theme, published')
    .eq('merchant_id', merchant.id)
    .single();

  if (configError || !config || !config.published) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-zinc-900">{merchant.name}</h1>
          <p className="mt-2 text-zinc-500">This website is currently under construction.</p>
        </div>
      </div>
    );
  }

  // Render based on JSONB layout
  const theme = config.theme as any;
  const layout = config.layout as any;

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        backgroundColor: theme?.backgroundColor || '#ffffff',
        color: theme?.textColor || '#18181b',
        fontFamily: theme?.font === 'inter' ? 'Inter, sans-serif' : 'inherit'
      }}
    >
      {/* Header */}
      <header className="p-6 border-b border-zinc-200 shadow-sm" style={{ backgroundColor: theme?.primary_color || '#18181b' }}>
        <h1 className="text-2xl font-bold text-white max-w-7xl mx-auto">
          {layout?.header?.title || merchant.name}
        </h1>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto">
        <h2 className="text-5xl font-extrabold tracking-tight mb-6">
          {layout?.hero?.headline || `Welcome to ${merchant.name}`}
        </h2>
        <p className="text-xl opacity-80 mb-10">
          {layout?.hero?.subheadline || 'Book your next adventure with us.'}
        </p>
        <button 
          className="px-8 py-4 rounded-md font-semibold text-white shadow-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: theme?.primary_color || '#18181b' }}
        >
          {layout?.hero?.ctaText || 'Book Now'}
        </button>
      </section>

      {/* Assets/Inventory Section */}
      <section className="py-16 px-6 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold mb-8 text-zinc-900">Our Offerings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mocked offerings for MVP */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="h-48 bg-zinc-200 w-full"></div>
                <div className="p-6">
                  <h4 className="text-xl font-semibold text-zinc-900 mb-2">Experience {i}</h4>
                  <p className="text-zinc-600 mb-4">Discover the beauty of Africa with our guided tours.</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-900">$150.00</span>
                    <button 
                      className="px-4 py-2 rounded-md text-sm font-medium text-white"
                      style={{ backgroundColor: theme?.primary_color || '#18181b' }}
                    >
                      Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

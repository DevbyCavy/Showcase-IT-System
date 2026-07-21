import { SimpleCatalogManager } from '@/components/SimpleCatalogManager'
import * as brandsApi from '@/api/brands'

// Translated from brand.php + custom/js/brand.js (DataTables -> TanStack Table).
export default function Brands() {
  return (
    <SimpleCatalogManager
      title="Manage Brand"
      entityName="Brand"
      nameLabel="Brand Name"
      queryKey="brands"
      api={brandsApi}
    />
  )
}

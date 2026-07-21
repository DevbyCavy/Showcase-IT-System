import { SimpleCatalogManager } from '@/components/SimpleCatalogManager'
import * as categoriesApi from '@/api/categories'

// Translated from categories.php + custom/categories.js (DataTables -> TanStack Table).
export default function Categories() {
  return (
    <SimpleCatalogManager
      title="Manage Categories"
      entityName="Category"
      nameLabel="Category Name"
      queryKey="categories"
      api={categoriesApi}
    />
  )
}

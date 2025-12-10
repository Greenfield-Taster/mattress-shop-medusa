import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Table, Badge } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { PlusMini } from "@medusajs/icons"

/**
 * Список матраців
 * URL: /app/mattresses
 */
const MattressesPage = () => {
  // Запит на отримання списку матраців
  const { data, isLoading } = useQuery({
    queryKey: ["mattresses"],
    queryFn: async () => {
      const response = await fetch("/admin/mattresses", {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to fetch")
      return response.json()
    },
  })

  const mattresses = data?.mattresses || []

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Матраци</Heading>
        <Link to="/app/mattresses/create">
          <Button variant="primary">
            <PlusMini />
            Додати матрац
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Завантаження...</div>
        ) : mattresses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Матраців поки немає. Створіть перший!
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Назва</Table.HeaderCell>
                <Table.HeaderCell>Висота</Table.HeaderCell>
                <Table.HeaderCell>Жорсткість</Table.HeaderCell>
                <Table.HeaderCell>Тип блоку</Table.HeaderCell>
                <Table.HeaderCell>Статус</Table.HeaderCell>
                <Table.HeaderCell>Варіантів</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {mattresses.map((mattress: any) => (
                <Table.Row key={mattress.id}>
                  <Table.Cell>
                    <Link 
                      to={`/app/products/${mattress.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {mattress.title}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    {mattress.mattress_attributes?.height} см
                  </Table.Cell>
                  <Table.Cell>
                    {mattress.mattress_attributes?.hardness}
                  </Table.Cell>
                  <Table.Cell>
                    {formatBlockType(mattress.mattress_attributes?.block_type)}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={mattress.status === "published" ? "green" : "grey"}>
                      {mattress.status === "published" ? "Опубліковано" : "Чернетка"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {mattress.variants?.length || 0}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  )
}

function formatBlockType(type: string): string {
  const labels: Record<string, string> = {
    independent_spring: "Незалежний пружинний",
    bonnel_spring: "Bonnel",
    springless: "Безпружинний",
  }
  return labels[type] || type
}

// Конфігурація роуту - додає пункт в sidebar
export const config = defineRouteConfig({
  label: "Матраци",
  icon: undefined, // Можна додати іконку
})

export default MattressesPage

@description('The name of the SQL logical server.')
param sqlServerName string = uniqueString('sql', resourceGroup().id)

@description('The name of the SQL Database.')
param sqlDBName string = 'sql-db'

@description('Location for all resources.')
param location string = resourceGroup().location

// User assigned managed identity to be used to reach database
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2022-01-31-preview' = {
  name: 'sql-managed-identity'
  location: location
}

resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administrators: {
      administratorType: 'ActiveDirectory'
      azureADOnlyAuthentication: true
      login: managedIdentity.name
      sid: managedIdentity.properties.principalId
      tenantId: managedIdentity.properties.tenantId
    }
  }
}

resource sqlDB 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: sqlDBName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
}

resource sqlServerAdministrator 'Microsoft.Sql/servers/administrators@2024-05-01-preview' = {
  parent: sqlServer
  name: 'ActiveDirectory'
  properties: {
    administratorType: 'ActiveDirectory'
    login: managedIdentity.name
    sid: managedIdentity.properties.principalId
    tenantId: managedIdentity.properties.tenantId
  }
}

resource aadAuth 'Microsoft.Sql/servers/azureADOnlyAuthentications@2024-05-01-preview' = {
  name: 'Default'
  parent: sqlServer
  properties: {
    azureADOnlyAuthentication: true
  }
}

import { z } from "zod";

export const ProviderEnum = z.enum(['conta_azul', 'pagar_me', 'celcoin', 'asaas']);
export const EnvironmentEnum = z.enum(['sandbox', 'production']);

export const IntegrationConfigSchema = z.object({
  id: z.string().uuid().optional(),
  provider: ProviderEnum,
  environment: EnvironmentEnum.default('sandbox'),
  
  api_key: z.string().min(10, "Chave muito curta"),
  api_secret: z.string().optional(),
  webhook_url: z.string().url().optional(),
  
  is_active: z.boolean().default(false),
});

export type IntegrationConfigDTO = z.infer<typeof IntegrationConfigSchema>;

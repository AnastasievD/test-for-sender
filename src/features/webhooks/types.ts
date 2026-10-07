export interface Webhook {
  id: number;
  name: string;
  url: string;
  active: boolean;
  created_at: string;
}

export interface WebhookList {
  data: Webhook[];
  paging: {
    pages: {
      current: number;
      last: number;
    };
    results: {
      total: number;
      limitation: number;
    };
  };
}

export interface WebhookUpdate {
  name: string;
  url: string;
}

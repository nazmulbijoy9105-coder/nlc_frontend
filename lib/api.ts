  login: (email: string, password: string) =>
    api.post<any>("/api/v1/auth/login", { email, password }, { auth: false }),
  },
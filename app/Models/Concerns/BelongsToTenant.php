<?php

namespace App\Models\Concerns;

use App\Models\Tenant;
use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            $tenantId = app(TenantContext::class)->id();
            if ($tenantId === null) {
                return;
            }

            $model = $builder->getModel();
            $table = $model->getTable();

            if (method_exists($model, 'allowsGlobalSuperAdmin') && $model->allowsGlobalSuperAdmin()) {
                $builder->where(function (Builder $q) use ($table, $tenantId) {
                    $q->where("{$table}.tenant_id", $tenantId)
                        ->orWhereNull("{$table}.tenant_id");
                });

                return;
            }

            $builder->where("{$table}.tenant_id", $tenantId);
        });

        static::creating(function ($model) {
            if ($model->tenant_id !== null) {
                return;
            }

            if (method_exists($model, 'isExplicitGlobalSuperAdmin') && $model->isExplicitGlobalSuperAdmin()) {
                return;
            }

            $tenantId = app(TenantContext::class)->id();
            if ($tenantId !== null) {
                $model->tenant_id = $tenantId;
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}

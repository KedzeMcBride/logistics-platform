'use client';

import { Car, CircleAlert, Pencil, Plus, Trash2, Truck, Bike, Package, X } from 'lucide-react';
import { FormEvent, useState } from 'react';

import {
  addVehicle,
  deleteVehicle,
  updateVehicle,
  useDriverProfile,
  type VehicleDto,
} from '@/features/drivers';
import { cn } from '@/lib/utils';

type VehicleType = 'BIKE' | 'CAR' | 'VAN' | 'TRUCK';

const vehicleTypes: {
  value: VehicleType;
  label: string;
  description: string;
}[] = [
  {
    value: 'BIKE',
    label: 'Motorbike',
    description: 'Motorcycles and bikes',
  },
  {
    value: 'CAR',
    label: 'Car',
    description: 'Cars and small vehicles',
  },
  {
    value: 'VAN',
    label: 'Van',
    description: 'Delivery vans',
  },
  {
    value: 'TRUCK',
    label: 'Truck',
    description: 'Large delivery vehicles',
  },
];

const vehicleIcons = {
  BIKE: Bike,
  CAR: Car,
  VAN: Truck,
  TRUCK: Truck,
};

export default function DriverVehiclesPage() {
  const { driver, isLoading, error, refetch } = useDriverProfile();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleDto | null>(null);

  const [formType, setFormType] = useState<VehicleType>('CAR');
  const [plateNumber, setPlateNumber] = useState('');
  const [capacityKg, setCapacityKg] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function resetForm() {
    setFormType('CAR');
    setPlateNumber('');
    setCapacityKg('');
    setEditingVehicle(null);
    setActionError(null);
  }

  function openAddForm() {
    resetForm();
    setIsFormOpen(true);
    setSuccessMessage(null);
  }

  function openEditForm(vehicle: VehicleDto) {
    setEditingVehicle(vehicle);
    setFormType(
      vehicle.type === 'BIKE' ||
        vehicle.type === 'CAR' ||
        vehicle.type === 'VAN' ||
        vehicle.type === 'TRUCK'
        ? vehicle.type
        : 'CAR',
    );
    setPlateNumber(vehicle.plateNumber);
    setCapacityKg(vehicle.capacityKg !== null ? String(vehicle.capacityKg) : '');
    setActionError(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;

    setIsFormOpen(false);
    resetForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setActionError(null);
    setSuccessMessage(null);

    const trimmedPlate = plateNumber.trim();

    if (!trimmedPlate) {
      setActionError('Please enter the vehicle plate number.');
      return;
    }

    const parsedCapacity = capacityKg.trim() ? Number(capacityKg) : undefined;

    if (
      parsedCapacity !== undefined &&
      (!Number.isFinite(parsedCapacity) || parsedCapacity < 0 || parsedCapacity > 5000)
    ) {
      setActionError('Capacity must be between 0 and 5000 kg.');
      return;
    }

    setIsSaving(true);

    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, {
          plateNumber: trimmedPlate,
          capacityKg: parsedCapacity,
        });

        setSuccessMessage('Vehicle updated successfully.');
      } else {
        await addVehicle({
          type: formType,
          plateNumber: trimmedPlate,
          ...(parsedCapacity !== undefined ? { capacityKg: parsedCapacity } : {}),
        });

        setSuccessMessage('Vehicle added successfully.');
      }

      await refetch();

      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : editingVehicle
            ? 'Unable to update vehicle.'
            : 'Unable to add vehicle.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!vehicleToDelete) return;

    setIsDeleting(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await deleteVehicle(vehicleToDelete.id);
      await refetch();

      setVehicleToDelete(null);
      setSuccessMessage('Vehicle deactivated successfully.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to deactivate vehicle.');
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <div className="h-8 w-48 animate-pulse rounded-md bg-neutral-200" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded-md bg-neutral-200" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-52 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

            <div>
              <h2 className="font-semibold text-red-900">Unable to load your vehicles</h2>

              <p className="mt-1 text-sm text-red-800">{error ?? 'Driver profile not found.'}</p>

              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-4 rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeVehicles = driver.vehicles.filter((vehicle) => vehicle.isActive);

  const inactiveVehicles = driver.vehicles.filter((vehicle) => !vehicle.isActive);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">My Vehicles</h2>

          <p className="mt-1 text-sm text-neutral-500">
            Manage the vehicles associated with your driver profile.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
        >
          <Plus className="h-4 w-4" />
          Add vehicle
        </button>
      </div>

      {/* Feedback */}
      {successMessage && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {successMessage}
        </div>
      )}

      {actionError && !isFormOpen && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
            Active vehicles
          </p>

          <p className="mt-2 text-2xl font-bold text-neutral-900">{activeVehicles.length}</p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
            Total vehicles
          </p>

          <p className="mt-2 text-2xl font-bold text-neutral-900">{driver.vehicles.length}</p>
        </div>
      </div>

      {/* Active vehicles */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Active vehicles</h3>

          <p className="mt-1 text-sm text-neutral-500">
            Vehicles currently available on your driver profile.
          </p>
        </div>

        {activeVehicles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <Car className="h-6 w-6 text-neutral-500" />
            </div>

            <h4 className="mt-4 font-semibold text-neutral-900">No active vehicles</h4>

            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Add a vehicle to your profile before going online and accepting deliveries.
            </p>

            <button
              type="button"
              onClick={openAddForm}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
            >
              <Plus className="h-4 w-4" />
              Add your first vehicle
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {activeVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onEdit={() => openEditForm(vehicle)}
                onDelete={() => setVehicleToDelete(vehicle)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Inactive vehicles */}
      {inactiveVehicles.length > 0 && (
        <section className="mt-10">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Inactive vehicles</h3>

            <p className="mt-1 text-sm text-neutral-500">
              Previously registered vehicles that are no longer active.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {inactiveVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                inactive
                onEdit={() => openEditForm(vehicle)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Add/Edit modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  {editingVehicle ? 'Edit vehicle' : 'Add vehicle'}
                </h3>

                <p className="mt-0.5 text-sm text-neutral-500">
                  {editingVehicle
                    ? 'Update your vehicle information.'
                    : 'Add a vehicle to your driver profile.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={isSaving}
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {actionError && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {!editingVehicle && (
                <div>
                  <label
                    htmlFor="vehicle-type"
                    className="mb-2 block text-sm font-medium text-neutral-900"
                  >
                    Vehicle type
                  </label>

                  <select
                    id="vehicle-type"
                    value={formType}
                    onChange={(event) => setFormType(event.target.value as VehicleType)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                    disabled={isSaving}
                  >
                    {vehicleTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>

                  <p className="mt-1.5 text-xs text-neutral-500">
                    {vehicleTypes.find((type) => type.value === formType)?.description}
                  </p>
                </div>
              )}

              {editingVehicle && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-900">
                    Vehicle type
                  </label>

                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-medium text-neutral-700">
                    {formatVehicleType(editingVehicle.type)}
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="plate-number"
                  className="mb-2 block text-sm font-medium text-neutral-900"
                >
                  Plate number
                </label>

                <input
                  id="plate-number"
                  type="text"
                  value={plateNumber}
                  onChange={(event) => setPlateNumber(event.target.value.toUpperCase())}
                  placeholder="e.g. LT 1234 AB"
                  disabled={isSaving}
                  maxLength={50}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm uppercase outline-none transition placeholder:normal-case placeholder:text-neutral-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:bg-neutral-100"
                />
              </div>

              <div>
                <label
                  htmlFor="capacity"
                  className="mb-2 block text-sm font-medium text-neutral-900"
                >
                  Capacity (kg)
                </label>

                <input
                  id="capacity"
                  type="number"
                  min="0"
                  max="5000"
                  step="0.1"
                  value={capacityKg}
                  onChange={(event) => setCapacityKg(event.target.value)}
                  placeholder="e.g. 500"
                  disabled={isSaving}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:bg-neutral-100"
                />

                <p className="mt-1.5 text-xs text-neutral-500">
                  Optional. Maximum supported capacity is 5000 kg.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-neutral-200 pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                  className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingVehicle ? 'Save changes' : 'Add vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
              <Trash2 className="h-5 w-5 text-red-700" />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-neutral-900">Deactivate vehicle?</h3>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              This will deactivate <strong>{vehicleToDelete.plateNumber}</strong>. The vehicle will
              remain in your records but will no longer be active.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                disabled={isDeleting}
                className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? 'Deactivating...' : 'Deactivate vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VehicleCard({
  vehicle,
  inactive = false,
  onEdit,
  onDelete,
}: {
  vehicle: VehicleDto;
  inactive?: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const Icon = vehicleIcons[vehicle.type as keyof typeof vehicleIcons] ?? Package;

  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-5 transition-shadow',
        inactive ? 'border-neutral-200 opacity-75' : 'border-neutral-200 hover:shadow-sm',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
          <Icon className="h-5 w-5" />
        </div>

        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-semibold',
            vehicle.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-100 text-neutral-600',
          )}
        >
          {vehicle.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
          {formatVehicleType(vehicle.type)}
        </p>

        <h4 className="mt-1 text-lg font-bold uppercase tracking-wide text-neutral-900">
          {vehicle.plateNumber}
        </h4>
      </div>

      <div className="mt-5 border-t border-neutral-100 pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">Capacity</span>

          <span className="font-medium text-neutral-900">
            {vehicle.capacityKg !== null
              ? `${formatNumber(vehicle.capacityKg)} kg`
              : 'Not specified'}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-neutral-500">Added</span>

          <span className="font-medium text-neutral-900">{formatDate(vehicle.createdAt)}</span>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>

        {vehicle.isActive && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Deactivate
          </button>
        )}
      </div>
    </div>
  );
}

function formatVehicleType(value: string) {
  switch (value) {
    case 'BIKE':
      return 'Motorbike';
    case 'CAR':
      return 'Car';
    case 'VAN':
      return 'Van';
    case 'TRUCK':
      return 'Truck';
    default:
      return value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleDateString();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

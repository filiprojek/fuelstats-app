import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/vehicle.dart';
import '../services/session_manager.dart';

class VehiclesScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final session = Provider.of<SessionManager>(context);
    final vehicles = session.vehicles;
    return Scaffold(
      body: vehicles.isEmpty
          ? Center(child: Text('No vehicles added yet.'))
          : ListView.builder(
              itemCount: vehicles.length,
              itemBuilder: (context, index) {
                final vehicle = vehicles[index];
                final isDefault = session.defaultVehicle?.id == vehicle.id;
                return ListTile(
                  title: Text(vehicle.name),
                  subtitle: Text(
                    '${vehicle.registrationPlate} • ${vehicle.fuelType.label}'
                    '${vehicle.note != null ? ' • ${vehicle.note}' : ''}',
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: Icon(Icons.star,
                            color: isDefault ? Colors.amber : Colors.grey),
                        tooltip:
                            isDefault ? 'Unset default' : 'Set as default',
                        onPressed: () => session.setDefaultVehicle(
                            isDefault ? null : vehicle.id),
                      ),
                      IconButton(
                        icon: Icon(Icons.edit, color: Colors.blue),
                        onPressed: () => _editVehicle(context, session, index, vehicle),
                      ),
                      IconButton(
                        icon: Icon(Icons.delete, color: Colors.red),
                        onPressed: () => _removeVehicle(context, session, index),
                      ),
                    ],
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _addVehicle(context, session),
        child: Icon(Icons.add),
        tooltip: 'Add Vehicle',
      ),
    );
  }

  void _addVehicle(BuildContext context, SessionManager session) async {
    final newVehicle = await showDialog<Vehicle>(
      context: context,
      builder: (context) => _VehicleDialog(),
    );
    if (newVehicle != null) {
      await session.addVehicle(newVehicle);
    }
  }

  void _editVehicle(BuildContext context, SessionManager session, int index,
      Vehicle vehicle) async {
    final updatedVehicle = await showDialog<Vehicle>(
      context: context,
      builder: (context) => _VehicleDialog(vehicle: vehicle),
    );
    if (updatedVehicle != null) {
      await session.updateVehicle(index, updatedVehicle);
    }
  }

  void _removeVehicle(
      BuildContext context, SessionManager session, int index) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Confirm Removal'),
        content: Text(
            'Are you sure you want to delete this vehicle? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await session.removeVehicle(index);
    }
  }
}

class _VehicleDialog extends StatefulWidget {
  final Vehicle? vehicle;
  const _VehicleDialog({this.vehicle});

  @override
  _VehicleDialogState createState() => _VehicleDialogState();
}

class _VehicleDialogState extends State<_VehicleDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _plateController;
  late TextEditingController _noteController;
  FuelType? _selectedFuelType;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.vehicle?.name ?? '');
    _plateController =
        TextEditingController(text: widget.vehicle?.registrationPlate ?? '');
    _noteController = TextEditingController(text: widget.vehicle?.note ?? '');
    _selectedFuelType = widget.vehicle?.fuelType;
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.vehicle == null ? 'Add New Vehicle' : 'Edit Vehicle'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(labelText: 'Vehicle Name'),
                validator: (value) =>
                    value == null || value.isEmpty ? 'Enter a vehicle name' : null,
              ),
              TextFormField(
                controller: _plateController,
                decoration: InputDecoration(labelText: 'Registration Plate'),
                validator: (value) =>
                    value == null || value.isEmpty ? 'Enter a plate number' : null,
              ),
              DropdownButtonFormField<FuelType>(
                decoration: InputDecoration(labelText: 'Fuel Type'),
                value: _selectedFuelType,
                items: FuelType.values
                    .map((fuelType) => DropdownMenuItem(
                          value: fuelType,
                          child: Text(fuelType.label),
                        ))
                    .toList(),
                onChanged: (value) => setState(() => _selectedFuelType = value),
                validator: (value) =>
                    value == null ? 'Please select a fuel type' : null,
              ),
              TextFormField(
                controller: _noteController,
                decoration: InputDecoration(labelText: 'Note (optional)'),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState?.validate() ?? false) {
              final vehicle = Vehicle(
                id: widget.vehicle?.id ??
                    DateTime.now().millisecondsSinceEpoch.toString(),
                name: _nameController.text,
                registrationPlate: _plateController.text,
                fuelType: _selectedFuelType!,
                note:
                    _noteController.text.isEmpty ? null : _noteController.text,
              );
              Navigator.pop(context, vehicle);
            }
          },
          child: Text(widget.vehicle == null ? 'Add' : 'Save'),
        ),
      ],
    );
  }
}
